# lambda/shorten/handler.py
import json
import boto3
import uuid
import os
from datetime import datetime
from urllib.parse import urlparse

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('URLS_TABLE', 'urls'))


def is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)

        # 스킴 검사
        if parsed.scheme not in ("http", "https"):
            return False

        # 호스트 존재 검사
        if not parsed.netloc:
            return False

        host = parsed.hostname or ""

        # localhost 허용 여부 (원하면 False로 변경)
        if host == "localhost":
            return True

        # 도메인에 점(.) 포함 필수
        if "." not in host:
            return False

        # TLD 최소 2글자
        tld = host.split(".")[-1]
        if len(tld) < 2:
            return False

        # 이상한 문자 방지
        if "_" in host or " " in host:
            return False

        return True

    except Exception:
        return False


def lambda_handler(event, context):
    try:
        # 요청 body 파싱
        body = json.loads(event.get('body', '{}'))
        original_url = body.get('url')
        title = body.get('title', '')
        
        # URL 유효성 검사
        if not original_url:
            return create_response(400, {'error': 'URL is required'})

        if not is_valid_url(original_url):
            return create_response(400, {'error': 'Invalid URL format'})
        
        # 단축 코드 생성 (UUID 앞 8자리)
        short_id = str(uuid.uuid4())[:8]
        
        # DynamoDB에 저장
        item = {
            'shortId': short_id,
            'originalUrl': original_url,
            'title': title,
            'createdAt': datetime.utcnow().isoformat(),
            'clickCount': 0
        }
        
        table.put_item(Item=item)
        
        # 응답
        # ✅ 항상 커스텀 도메인으로 만들기 (환경변수 BASE_URL 사용)
        base_url = os.environ.get("BASE_URL", "").rstrip("/")
        if not base_url:
            return create_response(500, {"error": "BASE_URL is not set"})

        short_url = f"{base_url}/{short_id}"

        return create_response(200, {
            'shortId': short_id,
            'shortUrl': short_url,
            'originalUrl': original_url
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }