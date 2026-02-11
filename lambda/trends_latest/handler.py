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
        # DynamoDB 숫자는 정수/실수 구분이 없어서,
        # 소수점이 없으면 int, 있으면 float로 변환
        if obj % 1 == 0:
            return int(obj)
        return float(obj)

    if isinstance(obj, list):
        return [_to_jsonable(x) for x in obj]

    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}

    return obj


def lambda_handler(event, context):
    try:
        qs = event.get("queryStringParameters") or {}
        period = qs.get("period") or os.environ.get("DEFAULT_PERIOD", "1h")

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
        return _resp(200, {"period": period, "trend": trend})

    except Exception as e:
        return _resp(500, {"error": str(e)})
