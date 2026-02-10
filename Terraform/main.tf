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
}

module "lambda" {
  source       = "./modules/lambda"
  project_name = var.project_name
  tags         = var.tags

  lambda_role_arn   = module.iam.lambda_role_arn
  urls_table_name   = module.dynamodb.urls_table_name
  clicks_table_name = module.dynamodb.clicks_table_name

  shorten_zip_path  = "${path.module}/../lambda/shorten/shorten.zip"
  redirect_zip_path = "${path.module}/../lambda/redirect/redirect.zip"
  stats_zip_path    = "${path.module}/../lambda/stats/stats.zip"
  analyze_zip_path    = "${path.module}/../lambda/analyze/analyze.zip"

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


# module "monitoring" {
#   source       = "./modules/monitoring"
#   project_name = var.project_name
#   tags         = var.tags

#   log_retention_days = 14

#   lambda_function_names = [
#     module.lambda.shorten_function_name,
#     module.lambda.redirect_function_name,
#     module.lambda.stats_function_name
#   ]

#   api_gateway_id      = module.apigw.api_id
#   dynamodb_table_name = module.dynamodb.clicks_table_name

#   depends_on = [module.lambda, module.apigw]
# }