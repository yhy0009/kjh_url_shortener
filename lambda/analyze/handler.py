# lambda/analyze/handler.py
import json
import boto3
import os
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
from openai import OpenAI

dynamodb = boto3.resource("dynamodb")
urls_table = dynamodb.Table(os.environ.get("URLS_TABLE", "urls"))
clicks_table = dynamodb.Table(os.environ.get("CLICKS_TABLE", "clicks"))
trends_table = dynamodb.Table(os.environ.get("TRENDS_TABLE", "trends"))

PERIOD = os.environ.get("PERIOD", "1h")  # 실행 주기 라벨(스케줄)로 쓰고 있음
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# -------------------------
# Helpers
# -------------------------
def _utcnow():
    return datetime.now(timezone.utc)

def _parse_iso(ts: str):
    # "2026-02-12T04:13:27Z" 또는 "2026-02-12T04:13:27+00:00" 모두 처리
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        return datetime.fromisoformat(ts)
    except Exception:
        return None

def extract_domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc or "unknown"
    except Exception:
        return "unknown"

def _normalize_referer(raw: str) -> str:
    if not raw:
        return "direct"
    raw = raw.strip()
    if raw in ("-", "null", "None"):
        return "direct"
    # URL이면 도메인으로 정규화
    if raw.startswith("http://") or raw.startswith("https://"):
        return extract_domain(raw) or "direct"
    return raw

def _scan_all(table):
    """DynamoDB scan pagination 처리"""
    items = []
    resp = table.scan()
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        items.extend(resp.get("Items", []))
    return items

# -------------------------
# Main
# -------------------------
def lambda_handler(event, context):
    """주기적으로 실행되어 트렌드 분석 (EventBridge 트리거)"""
    try:
        stats = collect_weekly_stats()
        insights = analyze_with_ai(stats)

        generated_at = _utcnow().replace(microsecond=0).isoformat().replace("+00:00", "Z")

        item = {
            "period": PERIOD,
            "generatedAt": generated_at,
            "stats": stats,
            "insights": insights,
            "model": MODEL,
            "totalClicks": int(stats.get("totalClicks", 0)),
            "totalUrls": int(stats.get("totalUrls", 0)),
        }

        trends_table.put_item(Item=item)

        return {
            "statusCode": 200,
            "body": json.dumps({"stats": stats, "insights": insights}, ensure_ascii=False),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}

def collect_weekly_stats():
    """
    주간 통계 수집 (전체 서비스 기준)
    - urls_table: totalUrls, topUrls, topDomains
    - clicks_table: clicksByHour, clicksByDay, clicksByReferer, peakHour, topReferer (+ totalClicks를 여기서 계산)
    """
    since = _utcnow() - timedelta(days=7)

    # 1) URL 데이터
    urls = _scan_all(urls_table)
    total_urls = len(urls)

    top_urls = sorted(urls, key=lambda x: int(x.get("clickCount", 0)), reverse=True)[:10]
    domains = [extract_domain(u.get("originalUrl", "")) for u in urls]
    domain_counts = Counter(domains).most_common(10)

    # 2) Click 데이터 (7일치만 필터링)
    clicks = _scan_all(clicks_table)

    clicks_by_hour = defaultdict(int)
    clicks_by_day = defaultdict(int)
    clicks_by_referer = defaultdict(int)

    total_clicks_7d = 0

    for c in clicks:
        ts = c.get("timestamp")
        dt = _parse_iso(ts) if isinstance(ts, str) else None
        if not dt:
            continue

        # dt가 naive면 UTC로 간주
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        if dt < since:
            continue

        total_clicks_7d += 1
        clicks_by_hour[str(dt.hour)] += 1
        clicks_by_day[dt.date().isoformat()] += 1

        ref = _normalize_referer(c.get("referer") or c.get("referrer") or c.get("source"))
        clicks_by_referer[ref] += 1

    peak_hour = None
    if clicks_by_hour:
        peak_hour = max(clicks_by_hour.items(), key=lambda kv: kv[1])[0]

    top_referer = None
    if clicks_by_referer:
        top_referer = max(clicks_by_referer.items(), key=lambda kv: kv[1])[0]

    return {
        "totalUrls": total_urls,
        "totalClicks": total_clicks_7d,  # 7일치 클릭 합 (기존 url.clickCount 합 대신)
        "topUrls": [{"shortId": u["shortId"], "clicks": int(u.get("clickCount", 0))} for u in top_urls],
        "topDomains": [{"domain": d, "count": c} for d, c in domain_counts],

        # --- 표의 “트래픽 패턴 / 유입 분석” 충족용 ---
        "clicksByHour": dict(clicks_by_hour),
        "clicksByDay": dict(clicks_by_day),
        "clicksByReferer": dict(clicks_by_referer),
        "peakHour": peak_hour,
        "topReferer": top_referer,
    }

def analyze_with_ai(stats):
    """AI로 트렌드 분석 (표 항목 반영)"""
    prompt = f"""
당신은 URL 단축 서비스의 데이터 분석가입니다. 아래 주간 통계를 바탕으로 요약/인사이트를 작성하세요.

[주간 통계 요약]
- 총 URL 생성: {stats.get('totalUrls', 0)}개
- 최근 7일 클릭 수: {stats.get('totalClicks', 0)}회
- 인기 도메인 Top: {json.dumps(stats.get('topDomains', []), ensure_ascii=False)}
- 시간대별 클릭: {json.dumps(stats.get('clicksByHour', {}), ensure_ascii=False)}
- 일자별 클릭: {json.dumps(stats.get('clicksByDay', {}), ensure_ascii=False)}
- 유입 경로(Referer): {json.dumps(stats.get('clicksByReferer', {}), ensure_ascii=False)}
- 피크 시간대: {stats.get('peakHour')}
- 최다 유입 경로: {stats.get('topReferer')}

[작성 항목]
1) 트래픽 패턴: 피크 시간대와 (가능하면) 일자/요일 경향을 한 문장으로
2) 유입 분석: direct vs 외부 유입(도메인)을 언급하고 소셜 추정이 가능하면 간단히
3) URL 트렌드: 인기 도메인 기반으로 콘텐츠 카테고리를 추정 (예: video/search/community 등)
4) 인사이트: "최적 공유 시간대" 1개와 서비스 개선 제안 1개를 제시

형식: 4~6문장, 한국어, 과장하지 말고 데이터 근거 기반으로.
""".strip()

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350,
            temperature=0.4,
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"AI 분석 실패: {str(e)}"
