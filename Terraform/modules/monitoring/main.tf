resource "aws_cloudwatch_log_group" "lambda" {
  for_each = toset(var.lambda_function_names)

  name              = "/aws/lambda/${each.value}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "${var.project_name}-lg-${each.value}"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda ${each.value} errors > 10 in 1 minute"

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${each.value}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 3000
  alarm_description   = "Lambda ${each.value} avg duration > 3 seconds"

  dimensions = {
    FunctionName = each.value
  }
}

resource "aws_cloudwatch_metric_alarm" "apigw_5xx" {
  alarm_name          = "api-gateway-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xx"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "API Gateway 5XX errors > 5 in 1 minute"

  dimensions = {
    ApiId = var.api_gateway_id
  }
}

resource "aws_cloudwatch_metric_alarm" "apigw_4xx" {
  alarm_name          = "api-gateway-4xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "4xx"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "API Gateway 4XX errors > 50 in 1 minute"

  dimensions = {
    ApiId = var.api_gateway_id
  }
}

# resource "aws_cloudwatch_metric_alarm" "dynamodb_rcu" {
#   alarm_name          = "dynamodb-consumed-rcu"
#   comparison_operator = "GreaterThanThreshold"
#   evaluation_periods  = 1
#   metric_name         = "ConsumedReadCapacityUnits"
#   namespace           = "AWS/DynamoDB"
#   period              = 60
#   statistic           = "Sum"
#   threshold           = 1000
#   alarm_description   = "DynamoDB RCU usage spike"

#   dimensions = {
#     TableName = var.dynamodb_table_name
#   }
# }

resource "aws_cloudwatch_metric_alarm" "dynamodb_rcu_urls" {
  alarm_name          = "dynamodb-urls-consumed-rcu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "DynamoDB urls RCU usage spike"

  dimensions = {
    TableName = var.urls_table_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_rcu_clicks" {
  alarm_name          = "dynamodb-clicks-consumed-rcu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "DynamoDB clicks RCU usage spike"

  dimensions = {
    TableName = var.clicks_table_name
  }
}

# ---------- Dashboard --------------

data "aws_region" "current" {}

locals {
  dashboard_name = coalesce(var.dashboard_name, "${var.project_name}-dashboard")

  lambda_invocations_metrics = [
    for fn in var.lambda_function_names : ["AWS/Lambda", "Invocations", "FunctionName", fn]
  ]

  lambda_errors_metrics = [
    for fn in var.lambda_function_names : ["AWS/Lambda", "Errors", "FunctionName", fn]
  ]

  lambda_duration_metrics = [
    for fn in var.lambda_function_names : ["AWS/Lambda", "Duration", "FunctionName", fn]
  ]
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = local.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      # ---------- Lambda: Invocations ----------
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          region  = data.aws_region.current.name
          title   = "Lambda Invocations (Sum, 1m)"
          period  = 60
          stat    = "Sum"
          metrics = local.lambda_invocations_metrics
        }
      },

      # ---------- Lambda: Errors ----------
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          region  = data.aws_region.current.name
          title   = "Lambda Errors (Sum, 1m)"
          period  = 60
          stat    = "Sum"
          metrics = local.lambda_errors_metrics
        }
      },

      # ---------- Lambda: Duration ----------
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          region  = data.aws_region.current.name
          title   = "Lambda Duration (Average, 1m)"
          period  = 60
          stat    = "Average"
          metrics = local.lambda_duration_metrics
        }
      },

      # ---------- API Gateway: 4xx/5xx ----------
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          region = data.aws_region.current.name
          title  = "HTTP API 4xx / 5xx (Sum, 1m)"
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/ApiGateway", "4xx", "ApiId", var.api_gateway_id],
            ["AWS/ApiGateway", "5xx", "ApiId", var.api_gateway_id]
          ]
        }
      },

      # ---------- API Gateway: Latency ----------
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          region = data.aws_region.current.name
          title  = "HTTP API Latency (Average, 1m)"
          period = 60
          stat   = "Average"
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiId", var.api_gateway_id],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiId", var.api_gateway_id]
          ]
        }
      },

      # ---------- DynamoDB: urls RCU/WCU ----------
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          region = data.aws_region.current.name
          title  = "DynamoDB urls RCU/WCU (Sum, 1m)"
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.urls_table_name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.urls_table_name]
          ]
        }
      },

      # ---------- DynamoDB: clicks RCU/WCU ----------
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          region = data.aws_region.current.name
          title  = "DynamoDB clicks RCU/WCU (Sum, 1m)"
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.clicks_table_name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.clicks_table_name]
          ]
        }
      }
    ]
  })
}