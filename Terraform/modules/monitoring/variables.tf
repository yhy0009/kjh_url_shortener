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
