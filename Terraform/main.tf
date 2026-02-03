module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name  = var.project_name
  tags          = var.tags

  # URL 만료 기능 쓰면 true로
  enable_ttl          = true
  ttl_attribute_name  = "expiresAt"
}

module "iam" {
  source       = "./modules/iam"
  project_name  = var.project_name
  tags          = var.tags

  urls_table_arn   = module.dynamodb.urls_table_arn
  clicks_table_arn = module.dynamodb.clicks_table_arn
}