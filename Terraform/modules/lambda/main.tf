resource "aws_lambda_function" "shorten" {
  filename      = var.shorten_zip_path
  function_name = "${var.project_name}-shorten"
  role          = var.lambda_role_arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 10

  # zip 내용 변경 감지용
  source_code_hash = filebase64sha256(var.shorten_zip_path)

  environment {
    variables = {
      URLS_TABLE = var.urls_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-shorten"
  })
}

resource "aws_lambda_function" "redirect" {
  filename      = var.redirect_zip_path
  function_name = "${var.project_name}-redirect"
  role          = var.lambda_role_arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 10

  source_code_hash = filebase64sha256(var.redirect_zip_path)

  environment {
    variables = {
      URLS_TABLE   = var.urls_table_name
      CLICKS_TABLE = var.clicks_table_name
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-redirect"
  })
}
