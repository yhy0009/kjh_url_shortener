resource "aws_cloudwatch_event_rule" "analyze_hourly" {
  name                = "${var.project_name}-analyze-hourly"
  description         = "Run analyze lambda every 1 hour"
  schedule_expression = "rate(1 hour)"
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "analyze" {
  rule      = aws_cloudwatch_event_rule.analyze_hourly.name
  target_id = "analyze"
  arn       = var.analyze_lambda_function_arn

  input = jsonencode({
    trigger = "eventbridge",
    period  = "1h"
  })
}

resource "aws_lambda_permission" "allow_eventbridge_analyze" {
  statement_id  = "AllowExecutionFromEventBridgeAnalyze"
  action        = "lambda:InvokeFunction"
  function_name = var.analyze_lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analyze_hourly.arn
}

# ---------------------------
# Categorize (6 hours)
# ---------------------------
resource "aws_cloudwatch_event_rule" "categorize_schedule" {
  name                = "${var.project_name}-categorize-6h"
  description         = "Run categorize lambda every 6 hours"
  schedule_expression = "rate(6 hours)"
  tags                = var.tags
}

resource "aws_cloudwatch_event_target" "categorize" {
  rule      = aws_cloudwatch_event_rule.categorize_schedule.name
  target_id = "categorize"
  arn       = var.categorize_lambda_function_arn

  input = jsonencode({
    trigger = "eventbridge",
    job     = "categorize"
  })
}

resource "aws_lambda_permission" "allow_eventbridge_categorize" {
  statement_id  = "AllowExecutionFromEventBridgeCategorize"
  action        = "lambda:InvokeFunction"
  function_name = var.categorize_lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.categorize_schedule.arn
}
