# lambda/analyze/handler.py
import json
import boto3
import os
from datetime import datetime, timedelta
from collections import Counter
from openai import OpenAI

dynamodb = boto3.resource('dynamodb')
urls_table = dynamodb.Table(os.environ.get('URLS_TABLE', 'urls'))
clicks_table = dynamodb.Table(os.environ.get('CLICKS_TABLE', 'clicks'))

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def lambda_handler(event, context):
    """주기적으로 실행되어 트렌드 분석 (CloudWatch Events 트리거)"""
    try:
        # 최근 7일간 데이터 수집
        stats = collect_weekly_stats()
        
        # AI 분석
        insights = analyze_with_ai(stats)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'stats': stats,
                'insights': insights
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def collect_weekly_stats():
    """주간 통계 수집"""
    # 전체 URL 스캔 (실제로는 페이지네이션 필요)
    response = urls_table.scan()
    urls = response.get('Items', [])
    
    # 통계 계산
    total_urls = len(urls)
    total_clicks = sum(int(u.get('clickCount', 0)) for u in urls)
    
    # 인기 URL Top 10
    top_urls = sorted(urls, key=lambda x: int(x.get('clickCount', 0)), reverse=True)[:10]
    
    # 도메인 분석
    domains = []
    for url in urls:
        original = url.get('originalUrl', '')
        domain = extract_domain(original)
        domains.append(domain)
    
    domain_counts = Counter(domains).most_common(10)
    
    return {
        'totalUrls': total_urls,
        'totalClicks': total_clicks,
        'topUrls': [{'shortId': u['shortId'], 'clicks': int(u.get('clickCount', 0))} for u in top_urls],
        'topDomains': [{'domain': d, 'count': c} for d, c in domain_counts]
    }

def analyze_with_ai(stats):
    """AI로 트렌드 분석"""
    prompt = f"""
당신은 URL 단축 서비스의 데이터 분석가입니다. 아래 통계를 분석해주세요.

[주간 통계]
- 총 생성된 URL: {stats['totalUrls']}개
- 총 클릭 수: {stats['totalClicks']}회
- 인기 도메인: {json.dumps(stats['topDomains'], ensure_ascii=False)}

[분석 요청]
1. 주요 트렌드 (어떤 종류의 콘텐츠가 인기인가)
2. 사용 패턴 인사이트
3. 서비스 개선 제안

간결하게 3-4문장으로 답변해주세요.
""".strip()

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.5,
        )
        return resp.choices[0].message.content
    except Exception as e:
        return f"AI 분석 실패: {str(e)}"

def extract_domain(url):
    """URL에서 도메인 추출"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc or 'unknown'
    except:
        return 'unknown'