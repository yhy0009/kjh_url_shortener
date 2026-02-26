output "urls_table_name" {
  value = aws_dynamodb_table.urls.name
}

output "urls_table_arn" {
  value = aws_dynamodb_table.urls.arn
}

output "clicks_table_name" {
  value = aws_dynamodb_table.clicks.name
}

output "clicks_table_arn" {
  value = aws_dynamodb_table.clicks.arn
}

output "trends_table_name" { 
  value = aws_dynamodb_table.trends.name 
}

output "trends_table_arn"  { 
  value = aws_dynamodb_table.trends.arn 
}