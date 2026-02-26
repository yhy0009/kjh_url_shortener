# lambda/stats/handler.py
import json
import boto3
import os
from datetime import datetime, timedelta
from collections import defaultdict
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
urls_table = dynamodb.Table(os.environ.get('URLS_TABLE', 'urls'))
clicks_table = dynamodb.Table(os.environ.get('CLICKS_TABLE', 'clicks'))

def lambda_handler(event, context):
    try:
        short_id = event.get('pathParameters', {}).get('shortId')
        
        if not short_id:
            return create_response(400, {'error': 'Short ID is required'})
        
        # URL 정보 조회
        url_response = urls_table.get_item(Key={'shortId': short_id})
        url_item = url_response.get('Item')
        
        if not url_item:
            return create_response(404, {'error': 'URL not found'})
        
        # 클릭 로그 조회 (최근 7일)
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        clicks_response = clicks_table.query(
            KeyConditionExpression=Key('shortId').eq(short_id) & Key('timestamp').gte(seven_days_ago)
        )
        clicks = clicks_response.get('Items', [])
        
        # 통계 계산
        stats = calculate_stats(clicks)
        
        return create_response(200, {
            'shortId': short_id,
            'originalUrl': url_item.get('originalUrl'),
            'title': url_item.get('title', ''),
            'totalClicks': int(url_item.get('clickCount', 0)),
            'period': '7d',
            'stats': stats
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def calculate_stats(clicks):
    """클릭 데이터 통계 계산"""
    clicks_by_hour = defaultdict(int)
    clicks_by_day = defaultdict(int)
    clicks_by_referer = defaultdict(int)
    
    for click in clicks:
        timestamp = click.get('timestamp', '')
        referer = click.get('referer', 'direct')
        
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                hour = dt.hour
                day = dt.strftime('%Y-%m-%d')
                
                clicks_by_hour[hour] += 1
                clicks_by_day[day] += 1
            except:
                pass
        
        # 리퍼러 도메인 추출
        referer_domain = extract_domain(referer)
        clicks_by_referer[referer_domain] += 1
    
    return {
        'clicksByHour': dict(clicks_by_hour),
        'clicksByDay': dict(clicks_by_day),
        'clicksByReferer': dict(clicks_by_referer),
        'peakHour': max(clicks_by_hour, key=clicks_by_hour.get) if clicks_by_hour else None,
        'topReferer': max(clicks_by_referer, key=clicks_by_referer.get) if clicks_by_referer else None
    }

def extract_domain(url):
    """URL에서 도메인 추출"""
    if not url or url == 'direct':
        return 'direct'
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc or 'unknown'
    except:
        return 'unknown'

def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }