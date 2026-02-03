variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

variable "urls_table_arn" {
  type        = string
  description = "ARN of urls DynamoDB table"
}

variable "clicks_table_arn" {
  type        = string
  description = "ARN of clicks DynamoDB table"
}
