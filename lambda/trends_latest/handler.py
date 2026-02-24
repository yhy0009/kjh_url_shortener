import json
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
trends_table = dynamodb.Table(os.environ.get("TRENDS_TABLE"))

def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }

def _to_jsonable(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)

    if isinstance(obj, list):
        return [_to_jsonable(x) for x in obj]

    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}

    return obj

def _filter_for_view(trend: dict, view: str) -> dict:
    """
    view=user: 사용자용 정보만 반환 (admin 인사이트 제거)
    view=admin: 전체 반환
    """
    if view != "user":
        return trend

    filtered = dict(trend)  # shallow copy

    insights = filtered.get("insights")

    # 최신 구조: insights가 {"admin":[...], "user":[...]} 형태
    if isinstance(insights, dict):
        user_insights = insights.get("user", [])
        filtered["insights"] = {"user": user_insights}

    # 과거 데이터 호환: insights가 문자열인 경우 그대로 둠(사용자 페이지에서도 보여줄지 판단 필요)
    # 여기서는 사용자 페이지라면 문자열 insights는 그대로 전달(혹은 제거도 가능)
    # if isinstance(insights, str):
    #     filtered.pop("insights", None)

    # 혹시 admin 전용 필드가 생기면 여기서 제거하면 됨
    # filtered.pop("someAdminOnlyField", None)

    return filtered

def lambda_handler(event, context):
    try:
        qs = event.get("queryStringParameters") or {}
        period = qs.get("period") or os.environ.get("DEFAULT_PERIOD", "1h")
        view = (qs.get("view") or qs.get("audience") or "admin").strip().lower()
        if view not in ("admin", "user"):
            view = "admin"

        # PK=period, SK=generatedAt 최신 1건
        res = trends_table.query(
            KeyConditionExpression=Key("period").eq(period),
            ScanIndexForward=False,   # 최신(내림차순)
            Limit=1
        )

        items = res.get("Items", [])
        if not items:
            return _resp(404, {"error": "No trend data", "period": period})

        trend = _to_jsonable(items[0])
        if not isinstance(trend, dict):
            return _resp(500, {"error": "Invalid trend item"})

        trend = _filter_for_view(trend, view)

        return _resp(200, {"period": period, "view": view, "trend": trend})

    except Exception as e:
        return _resp(500, {"error": str(e)})
