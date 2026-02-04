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

  shorten_zip_path  = "${path.module}/../lambda/shorten.zip"
  redirect_zip_path = "${path.module}/../lambda/redirect.zip"
  stats_zip_path    = "${path.module}/../lambda/stats.zip"

  depends_on = [module.dynamodb, module.iam]
}

module "apigw" {
  source       = "./modules/apigw"
  project_name = var.project_name
  tags         = var.tags

  shorten_invoke_arn     = module.lambda.shorten_invoke_arn
  shorten_function_name  = module.lambda.shorten_function_name
  redirect_invoke_arn    = module.lambda.redirect_invoke_arn
  redirect_function_name = module.lambda.redirect_function_name

  depends_on = [module.lambda]
}
