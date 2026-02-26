output "api_endpoint" {
  value = aws_apigatewayv2_stage.prod.invoke_url
}

output "api_id" {
  value = aws_apigatewayv2_api.api.id
}

output "redirect_domain_target" {
  value = aws_apigatewayv2_domain_name.redirect.domain_name_configuration[0].target_domain_name
}

output "redirect_domain_zone_id" {
  value = aws_apigatewayv2_domain_name.redirect.domain_name_configuration[0].hosted_zone_id
}