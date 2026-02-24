import json
import os
import re
import boto3
from datetime import datetime, timezone
from urllib.parse import urlparse
from decimal import Decimal, ROUND_HALF_UP

from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from openai import OpenAI

# -------------------------
# Config / Clients
# -------------------------
dynamodb = boto3.resource("dynamodb")
urls_table = dynamodb.Table(os.environ.get("URLS_TABLE", "urls"))

MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# 카테고리 확장: search 추가 (naver/google 같은 검색/포털을 룰로 처리)
CATEGORIES = {
    "news", "shopping", "video", "blog", "docs", "community", "social", "dev", "search", "other"
}

# 도메인 룰은 계속 늘리면 LLM 비용/시간이 확 줄어듭니다.
DOMAIN_RULES = {
    # video
    "youtube.com": ("video", 0.95, "domain=youtube.com"),
    "youtu.be": ("video", 0.95, "domain=youtu.be"),
    "tiktok.com": ("video", 0.90, "domain=tiktok.com"),

    # social
    "instagram.com": ("social", 0.95, "domain=instagram.com"),
    "facebook.com": ("social", 0.90, "domain=facebook.com"),
    "x.com": ("social", 0.90, "domain=x.com"),
    "twitter.com": ("social", 0.90, "domain=twitter.com"),

    # dev/docs
    "github.com": ("dev", 0.95, "domain=github.com"),
    "developer.mozilla.org": ("docs", 0.95, "domain=developer.mozilla.org"),
    "docs.aws.amazon.com": ("docs", 0.95, "domain=docs.aws.amazon.com"),
    "kubernetes.io": ("docs", 0.95, "domain=kubernetes.io"),

    # news (KR)
    "news.naver.com": ("news", 0.95, "domain=news.naver.com"),
    "media.naver.com": ("news", 0.90, "domain=media.naver.com"),
    "news.daum.net": ("news", 0.95, "domain=news.daum.net"),

    # shopping (KR)
    "coupang.com": ("shopping", 0.95, "domain=coupang.com"),
    "smartstore.naver.com": ("shopping", 0.90, "domain=smartstore.naver.com"),
    "11st.co.kr": ("shopping", 0.90, "domain=11st.co.kr"),
    "gmarket.co.kr": ("shopping", 0.90, "domain=gmarket.co.kr"),

    # portal/search
    "naver.com": ("search", 0.85, "domain=naver.com"),
    "google.com": ("search", 0.85, "domain=google.com"),
    "daum.net": ("search", 0.80, "domain=daum.net"),

    # blog platforms (룰로 잡아주면 LLM 호출 크게 감소)
    "velog.io": ("blog", 0.90, "domain=velog.io"),
    "tistory.com": ("blog", 0.85, "domain=tistory.com"),
    "medium.com": ("blog", 0.85, "domain=medium.com"),
}

# -------------------------
# Helpers
# -------------------------
def _utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def _norm_host(host: str) -> str:
    host = (host or "").lower()
    return host[4:] if host.startswith("www.") else host

def _parse_host(url: str) -> str:
    try:
        return _norm_host(urlparse(url).netloc)
    except Exception:
        return ""

def _safe_category(cat: str) -> str:
    return cat if cat in CATEGORIES else "other"

def _to_decimal_conf(conf) -> Decimal:
    # DynamoDB는 float를 지원하지 않으므로 Decimal로 저장
    try:
        x = float(conf)
    except Exception:
        x = 0.5
    x = max(0.0, min(1.0, x))
    return Decimal(str(x)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)

def _extract_json_object(text: str) -> str:
    """
    LLM 응답이 코드블럭/설명문 포함해도 JSON만 뽑아내기.
    - ```json ... ``` 제거
    - 첫 번째 { ... } 블록 추출
    """
    text = (text or "").strip()

    # 코드블럭 제거
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^```\s*", "", text).strip()
    text = re.sub(r"\s*```$", "", text).strip()

    m = re.search(r"\{.*\}", text, re.DOTALL)
    return m.group(0).strip() if m else text

# -------------------------
# Rule Classifier
# -------------------------
def rule_classify(url: str):
    """
    룰 기반 분류. 매칭 시 (category, confidence(float), reason) 반환, 실패 시 None
    """
    try:
        p = urlparse(url)
        host = _norm_host(p.netloc)
        path = (p.path or "").lower()

        # exact match
        if host in DOMAIN_RULES:
            return DOMAIN_RULES[host]

        # suffix match (subdomains)
        for d, r in DOMAIN_RULES.items():
            if host == d or host.endswith("." + d):
                return r

        # path heuristics
        if any(x in path for x in ["/blog", "/posts", "/post/"]):
            return ("blog", 0.70, "path looks like blog")
        if any(x in path for x in ["/docs", "/documentation", "/guide"]):
            return ("docs", 0.70, "path looks like docs")
        if any(x in path for x in ["/product", "/products", "/item", "/detail"]):
            return ("shopping", 0.65, "path looks like product page")

        return None
    except Exception:
        return None

# -------------------------
# DynamoDB
# -------------------------
def fetch_uncategorized_urls(limit: int = 50):
    """
    category 필드가 없는 urls만 scan으로 조회 (MVP)
    """
    items = []
    last_key = None

    while len(items) < limit:
        kwargs = {
            "FilterExpression": Attr("category").not_exists(),
            "Limit": min(100, limit - len(items)),
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key

        res = urls_table.scan(**kwargs)
        items.extend(res.get("Items", []))
        last_key = res.get("LastEvaluatedKey")
        if not last_key:
            break

    out = []
    for it in items:
        if "shortId" in it and "originalUrl" in it:
            out.append({
                "shortId": it["shortId"],
                "url": it["originalUrl"],
                "title": it.get("title", "")
            })
    return out

def update_url_category(short_id: str, category: str, confidence, source: str, reason: str):
    category = _safe_category(category)
    conf_dec = _to_decimal_conf(confidence)

    try:
        urls_table.update_item(
            Key={"shortId": short_id},
            UpdateExpression=(
                "SET #cat=:c, categoryConfidence=:cc, categorizedAt=:t, categorySource=:s, categoryReason=:r"
            ),
            ExpressionAttributeNames={"#cat": "category"},
            ExpressionAttributeValues={
                ":c": category,
                ":cc": conf_dec,
                ":t": _utc_iso(),
                ":s": source,
                ":r": (reason or "")[:200],
            },
        )
        return True
    except ClientError as e:
        print("update_item error:", str(e))
        return False

# -------------------------
# LLM Classifier
# -------------------------
def llm_classify(batch):
    """
    룰에 안 걸린 URL들을 LLM으로 분류.
    batch: [{shortId, url, title}]
    return: shortId -> {category, confidence(float), reason}
    """
    if not batch:
        return {}

    if not OPENAI_API_KEY or client is None:
        return {it["shortId"]: {"category": "other", "confidence": 0.4, "reason": "no_openai_key"} for it in batch}

    system = (
        "You are a URL categorization engine. "
        "Return JSON only (no markdown). "
        "Allowed categories: news, shopping, video, blog, docs, community, social, dev, search, other. "
        "Confidence must be between 0 and 1."
    )
    user = {"task": "categorize_urls", "items": batch}

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": json.dumps(user, ensure_ascii=False)},
            ],
            max_tokens=700,
            temperature=0.2,
        )
        raw = (resp.choices[0].message.content or "").strip()
    except Exception as e:
        return {it["shortId"]: {"category": "other", "confidence": 0.3, "reason": f"llm_error:{str(e)[:120]}"} for it in batch}

    json_text = _extract_json_object(raw)

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError:
        # 디버깅용 원문 일부 로깅 (민감정보 없게 일부만)
        print("LLM raw response (head):", raw[:300])
        return {it["shortId"]: {"category": "other", "confidence": 0.3, "reason": "llm_json_parse_failed"} for it in batch}

    out = {}
    for item in data.get("items", []):
        sid = item.get("shortId")
        if not sid:
            continue

        cat = _safe_category(item.get("category", "other"))
        reason = (item.get("reason") or "")[:200]

        conf = item.get("confidence", 0.5)
        try:
            conf = float(conf)
        except Exception:
            conf = 0.5
        conf = max(0.0, min(1.0, conf))

        out[sid] = {"category": cat, "confidence": conf, "reason": reason}

    # 결과 누락 방어
    for it in batch:
        if it["shortId"] not in out:
            out[it["shortId"]] = {"category": "other", "confidence": 0.4, "reason": "llm_no_result"}

    return out

# -------------------------
# Orchestration
# -------------------------
def categorize_urls(limit: int, llm_batch_size: int):
    targets = fetch_uncategorized_urls(limit=limit)
    if not targets:
        return {"updated": 0, "rule": 0, "llm": 0, "skipped": 0}

    updated = 0
    rule_cnt = 0
    llm_cnt = 0
    need_llm = []

    # 1) 룰 분류
    for it in targets:
        r = rule_classify(it["url"])
        if r:
            cat, conf, reason = r
            if update_url_category(it["shortId"], cat, conf, "rule", reason):
                updated += 1
                rule_cnt += 1
        else:
            need_llm.append(it)

    # 2) LLM 분류 (batch)
    for i in range(0, len(need_llm), llm_batch_size):
        batch = need_llm[i:i + llm_batch_size]
        res = llm_classify(batch)

        for it in batch:
            sid = it["shortId"]
            info = res.get(sid) or {"category": "other", "confidence": 0.4, "reason": "llm_no_result"}
            if update_url_category(sid, info["category"], info["confidence"], "llm", info.get("reason", "")):
                updated += 1
                llm_cnt += 1

    skipped = len(targets) - updated
    return {"updated": updated, "rule": rule_cnt, "llm": llm_cnt, "skipped": skipped}

# -------------------------
# Lambda Entrypoint
# -------------------------
def lambda_handler(event, context):
    limit = int(os.environ.get("CATEGORIZE_LIMIT", "50"))
    llm_batch_size = int(os.environ.get("LLM_BATCH_SIZE", "15"))

    result = categorize_urls(limit=limit, llm_batch_size=llm_batch_size)
    print("categorize result:", result)

    return {"statusCode": 200, "body": json.dumps(result, ensure_ascii=False)}
