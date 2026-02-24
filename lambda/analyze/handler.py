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

PERIOD = os.environ.get("PERIOD", "1h")  # 실행 주기 라벨
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
    raw = str(raw).strip()
    if raw in ("-", "null", "None"):
        return "direct"
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

def _safe_int(v, default=0):
    try:
        return int(v)
    except Exception:
        return default

def _safe_json_loads(s: str):
    try:
        return json.loads(s)
    except Exception:
        return None

# -------------------------
# Main
# -------------------------
def lambda_handler(event, context):
    """주기적으로 실행되어 트렌드 분석 (EventBridge 트리거)"""
    try:
        stats = collect_weekly_stats()
        insights = analyze_with_ai(stats)  # dict: {"admin":[...], "user":[...]}

        generated_at = _utcnow().replace(microsecond=0).isoformat().replace("+00:00", "Z")

        item = {
            "period": PERIOD,
            "generatedAt": generated_at,
            "stats": stats,
            "insights": insights,           # ✅ 구조화 저장
            "model": MODEL,
            "totalClicks": _safe_int(stats.get("totalClicks", 0)),
            "totalUrls": _safe_int(stats.get("totalUrls", 0)),
        }

        trends_table.put_item(Item=item)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {"period": PERIOD, "generatedAt": generated_at, "stats": stats, "insights": insights},
                ensure_ascii=False,
            ),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}

def collect_weekly_stats():
    """
    주간 통계 수집 (전체 서비스 기준)
    - urls_table: totalUrls, topUrls, topDomains, categoryCounts
    - clicks_table: clicksByHour, clicksByDay, clicksByReferer, peakHour, topReferer (+ totalClicks 계산)
    """
    since = _utcnow() - timedelta(days=7)

    # 1) URL 데이터
    urls = _scan_all(urls_table)
    total_urls = len(urls)

    # Top URLs: clickCount 기준
    top_urls = sorted(urls, key=lambda x: _safe_int(x.get("clickCount", 0)), reverse=True)[:10]

    # destination domain 집계 (urls 기준)
    domains = [extract_domain(u.get("originalUrl", "")) for u in urls]
    domain_counts = Counter(domains).most_common(10)

    # ✅ 카테고리 집계 (urls_table에 category가 있다고 가정, 없으면 unknown)
    categories = [(u.get("category") or u.get("cat") or "unknown") for u in urls]
    category_counts = Counter(categories).most_common(10)

    # 2) Click 데이터 (7일치만)
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

        # naive면 UTC로 간주
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
        "totalClicks": total_clicks_7d,  # 최근 7일 클릭 합
        "topUrls": [{"shortId": u.get("shortId"), "clicks": _safe_int(u.get("clickCount", 0))} for u in top_urls],
        "topDomains": [{"domain": d, "count": c} for d, c in domain_counts],

        # ✅ 사용자용 UI(카테고리 카드) 지원
        "categoryCounts": [{"category": k, "count": v} for k, v in category_counts],

        # 트래픽 패턴 / 유입 분석
        "clicksByHour": dict(clicks_by_hour),
        "clicksByDay": dict(clicks_by_day),
        "clicksByReferer": dict(clicks_by_referer),
        "peakHour": peak_hour,
        "topReferer": top_referer,
    }

def analyze_with_ai(stats):
    """
    AI로 트렌드 분석
    - 한 번 호출로 admin/user 인사이트를 JSON으로 반환
    - 실패 시 폴백 문자열 생성
    """
    # OpenAI에 넘기는 stats는 너무 길어질 수 있으니 핵심만 요약해서 전달
    compact = {
        "totalUrls": stats.get("totalUrls", 0),
        "totalClicks": stats.get("totalClicks", 0),
        "topDomains": stats.get("topDomains", [])[:5],
        "categoryCounts": stats.get("categoryCounts", [])[:5],
        "clicksByHour": stats.get("clicksByHour", {}),
        "clicksByDay": stats.get("clicksByDay", {}),
        "clicksByReferer": stats.get("clicksByReferer", {}),
        "peakHour": stats.get("peakHour"),
        "topReferer": stats.get("topReferer"),
    }

    prompt = f"""
너는 URL 단축 서비스의 분석가다. 아래 통계(stats)를 바탕으로
(1) 관리자용 인사이트, (2) 일반 사용자용 인사이트를 각각 작성하라.

중요:
- 출력은 반드시 JSON 한 덩어리만 반환한다. (설명/코드블록/추가 텍스트 금지)
- admin은 운영/마케팅/시스템 관점(모니터링, 유입 채널 개선, 캠페인 제안 등) 포함 가능
- user는 일반 사용자 관점(언제 공유하면 좋은지, 어떤 카테고리/도메인이 반응 좋은지)만. 내부 운영/정책/캠페인 언급 금지
- 과장 금지, stats 수치를 1개 이상 근거로 포함
- 각 배열은 4~6개 문장(또는 불릿 문장)으로 구성

반환 JSON 스키마:
{{
  "admin": ["문장1", "문장2", "..."],
  "user": ["문장1", "문장2", "..."]
}}

stats:
{json.dumps(compact, ensure_ascii=False)}
""".strip()

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.4,
        )
        text = (resp.choices[0].message.content or "").strip()

        data = _safe_json_loads(text)
        if isinstance(data, dict) and isinstance(data.get("admin"), list) and isinstance(data.get("user"), list):
            # 안전하게 문자열로만 구성
            admin = [str(x).strip() for x in data["admin"] if str(x).strip()]
            user = [str(x).strip() for x in data["user"] if str(x).strip()]
            return {"admin": admin[:6], "user": user[:6]}

        # JSON 파싱 실패 폴백
        return {
            "admin": [f"AI 응답 파싱 실패(원문): {text[:180]}"],
            "user": ["현재 데이터로 사용자용 인사이트를 생성하는 데 실패했습니다."],
        }

    except Exception as e:
        return {
            "admin": [f"AI 분석 실패: {str(e)}"],
            "user": ["AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요."],
        }
