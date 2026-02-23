variable "project_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "lambda_function_names" {
  type        = list(string)
  description = "Lambda function names to create log groups for"
}

variable "api_gateway_id" {
  type        = string
  description = "API Gateway ID (HTTP API)"
}

variable "dashboard_name" {
  type        = string
  description = "CloudWatch dashboard name"
  default     = null
}

variable "urls_table_name" {
  type        = string
  description = "DynamoDB urls table name"
}

variable "clicks_table_name" {
  type        = string
  description = "DynamoDB clicks table name"
}

variable "trends_table_name" {
  type        = string
  description = "DynamoDB trends table name"
}

