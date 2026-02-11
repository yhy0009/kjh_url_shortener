variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

variable "lambda_role_arn" {
  type        = string
  description = "IAM role ARN for Lambda execution"
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

variable "openai_api_key" {
  type        = string
  description = "OpenAI API key for analyze lambda"
  sensitive   = true
}

# zip 경로를 루트에서 넘겨줌
variable "shorten_zip_path" {
  type        = string
  description = "Path to shorten lambda zip"
}

variable "redirect_zip_path" {
  type        = string
  description = "Path to redirect lambda zip"
}

variable "stats_zip_path" {
  type        = string
  description = "Path to stats lambda zip"
}

variable "analyze_zip_path" {
  type        = string
  description = "Path to analyze lambda zip"
}