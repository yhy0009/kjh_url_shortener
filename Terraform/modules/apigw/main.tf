resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = var.cors_allow_methods
    allow_headers = var.cors_allow_headers
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-api"
  })
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "prod"
  auto_deploy = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-prod"
  })
}

# -------- Shorten (POST /shorten) --------
resource "aws_apigatewayv2_integration" "shorten" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.shorten_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "shorten" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST /shorten"
  target    = "integrations/${aws_apigatewayv2_integration.shorten.id}"
}

# -------- Redirect (GET /{shortId}) --------
resource "aws_apigatewayv2_integration" "redirect" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.redirect_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "redirect" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /{shortId}"
  target    = "integrations/${aws_apigatewayv2_integration.redirect.id}"
}

# -------- Stats (GET /stats/{shortId}) --------
resource "aws_apigatewayv2_integration" "stats" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = var.stats_invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "stats" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "GET /stats/{shortId}"
  target    = "integrations/${aws_apigatewayv2_integration.stats.id}"
}

# -------- Lambda Permissions --------
resource "aws_lambda_permission" "shorten" {
  statement_id  = "AllowAPIGatewayInvokeShorten"
  action        = "lambda:InvokeFunction"
  function_name = var.shorten_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_apigatewayv2_api.api.execution_arn}/*/*" # <-허용 권한이 넓은 테스트 후 수정 / source_arn = "${aws_apigatewayv2_api.api.execution_arn}/POST/shorten"
}

resource "aws_lambda_permission" "redirect" {
  statement_id  = "AllowAPIGatewayInvokeRedirect"
  action        = "lambda:InvokeFunction"
  function_name = var.redirect_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*" # <-허용 권한이 넓은 테스트 후 수정 / source_arn = "${aws_apigatewayv2_api.api.execution_arn}/GET/*"
}

resource "aws_lambda_permission" "stats" {
  statement_id  = "AllowAPIGatewayInvokeStats"
  action        = "lambda:InvokeFunction"
  function_name = var.stats_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}