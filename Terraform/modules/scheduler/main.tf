resource "aws_cloudwatch_event_rule" "analyze_hourly" {
  name                = "${var.project_name}-analyze-hourly"
  description         = "Run analyze lambda every 1 hour"
  schedule_expression = "rate(1 hour)"
  tags = var.tags
}

resource "aws_cloudwatch_event_target" "analyze" {
  rule      = aws_cloudwatch_event_rule.analyze_hourly.name
  target_id = "analyze"
  arn       = var.lambda_function_arn

  input = jsonencode({
    trigger = "eventbridge",
    period  = "1h"
  })
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analyze_hourly.arn
}
