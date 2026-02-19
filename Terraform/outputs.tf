output "urls_table_name" {
  value = module.dynamodb.urls_table_name
}

output "clicks_table_name" {
  value = module.dynamodb.clicks_table_name
}

output "api_endpoint" {
  description = "Base URL of HTTP API Gateway"
  value       = module.apigw.api_endpoint
}

output "front_endpoint" {
  description = "front_endpoint"
  value       = module.cloudfront.domain_name
}

output "ci_cd_role_arn" {
  value = module.github_oidc_frontend.role_arn
}