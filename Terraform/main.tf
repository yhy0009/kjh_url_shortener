module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  tags         = var.tags

  # URL 만료 기능 쓰면 true로
  enable_ttl         = true
  ttl_attribute_name = "expiresAt"
}

module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  tags         = var.tags

  urls_table_arn   = module.dynamodb.urls_table_arn
  clicks_table_arn = module.dynamodb.clicks_table_arn
  trends_table_arn = module.dynamodb.trends_table_arn
}

module "lambda" {
  source       = "./modules/lambda"
  project_name = var.project_name
  tags         = var.tags

  lambda_role_arn   = module.iam.lambda_role_arn
  urls_table_name   = module.dynamodb.urls_table_name
  clicks_table_name = module.dynamodb.clicks_table_name
  trends_table_name = module.dynamodb.trends_table_name

  shorten_zip_path  = "${path.module}/../lambda/shorten/shorten.zip"
  redirect_zip_path = "${path.module}/../lambda/redirect/redirect.zip"
  stats_zip_path    = "${path.module}/../lambda/stats/stats.zip"
  analyze_zip_path  = "${path.module}/../lambda/analyze/analyze.zip"
  trends_latest_zip_path = "${path.module}/../lambda/trends_latest/trends_latest.zip"

  openai_api_key    = var.openai_api_key

  depends_on = [module.dynamodb, module.iam]
}

module "apigw" {
  source       = "./modules/apigw"
  project_name = var.project_name
  tags         = var.tags

  shorten_invoke_arn    = module.lambda.shorten_invoke_arn
  shorten_function_name = module.lambda.shorten_function_name

  redirect_invoke_arn    = module.lambda.redirect_invoke_arn
  redirect_function_name = module.lambda.redirect_function_name

  stats_invoke_arn    = module.lambda.stats_invoke_arn
  stats_function_name = module.lambda.stats_function_name

  trends_latest_invoke_arn      = module.lambda.trends_latest_invoke_arn
  trends_latest_function_name   = module.lambda.trends_latest_function_name


  depends_on = [module.lambda]
}

module "monitoring" {
  source       = "./modules/monitoring"
  project_name = var.project_name
  tags         = var.tags

  log_retention_days = 14

  lambda_function_names = [
    module.lambda.shorten_function_name,
    module.lambda.redirect_function_name,
    module.lambda.stats_function_name
  ]

  api_gateway_id    = module.apigw.api_id
  urls_table_name   = module.dynamodb.urls_table_name
  clicks_table_name = module.dynamodb.clicks_table_name

  depends_on = [module.lambda, module.apigw]
}

module "scheduler" {
  source = "./modules/scheduler"

  project_name = var.project_name
  tags         = var.tags

  lambda_function_name = module.lambda.analyze_function_name
  lambda_function_arn  = module.lambda.analyze_function_arn

  depends_on = [module.lambda]
}

module "cloudfront" {
  source             = "./modules/cloudfront"
  project_name       = var.project_name
  origin_domain_name = module.s3.bucket_regional_domain_name
  tags               = var.tags

  # Next 정적 라우팅 (권장)
  enable_spa_fallback = true
  aliases            = [var.frontend_domain]
  acm_certificate_arn = module.acm_frontend.certificate_arn
}

module "s3" {
  source      = "./modules/s3"
  bucket_name = replace("${var.project_name}-frontend", "_", "-")
  tags        = var.tags

  # 개발 중엔 true로 편하게, 운영은 false 권장
  force_destroy     = true
  enable_versioning = true

  # CloudFront 만든 뒤에 연결 (나중에 추가)
  attach_cloudfront_policy    = true
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
}

module "github_oidc_frontend" {
  source = "./modules/iam_github_oidc"

  project_name = var.project_name
  repo         = "yhy0009/kjh_url_shortener" 

  bucket_arn = module.s3.bucket_arn
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
}

module "route53" {
  source = "./modules/route53"

  domain_name = "r53-kjh.shop"
  tags        = var.tags

  create_alias           = true
  record_name            = "short"  # zone이 r53-kjh.shop 이면 short만 줘도 됨 (FQDN도 가능)
  cloudfront_domain_name = module.cloudfront.domain_name
  cloudfront_zone_id     = module.cloudfront.hosted_zone_id
}

module "acm_frontend" {
  source = "./modules/acm_us_east_1"

  providers = {
    aws = aws.us_east_1
  }

  domain_name = var.frontend_domain
  zone_id     = module.route53.zone_id
  tags        = var.tags
}