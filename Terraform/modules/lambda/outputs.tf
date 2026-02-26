output "shorten_function_name" {
  value = aws_lambda_function.shorten.function_name
}

output "shorten_function_arn" {
  value = aws_lambda_function.shorten.arn
}

output "redirect_function_name" {
  value = aws_lambda_function.redirect.function_name
}

output "redirect_function_arn" {
  value = aws_lambda_function.redirect.arn
}

output "shorten_invoke_arn" {
  value = aws_lambda_function.shorten.invoke_arn
}

output "redirect_invoke_arn" {
  value = aws_lambda_function.redirect.invoke_arn
}

output "stats_function_name" {
  value = aws_lambda_function.stats.function_name
}

output "stats_function_arn" {
  value = aws_lambda_function.stats.arn
}

output "stats_invoke_arn" {
  value = aws_lambda_function.stats.invoke_arn
}

output "analyze_function_name" {
  value = aws_lambda_function.analyze.function_name
}

output "analyze_function_arn" {
  value = aws_lambda_function.analyze.arn
}

output "analyze_invoke_arn" {
  value = aws_lambda_function.analyze.invoke_arn
}

output "trends_latest_function_name" { 
  value = aws_lambda_function.trends_latest.function_name 
}

output "trends_latest_function_arn"  { 
  value = aws_lambda_function.trends_latest.arn 
}

output "trends_latest_invoke_arn"    { 
  value = aws_lambda_function.trends_latest.invoke_arn 
}

output "categorize_function_name" {
  value = aws_lambda_function.categorize.function_name
}

output "categorize_function_arn" {
  value = aws_lambda_function.categorize.arn
}

