variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

# Lambda 연결 정보 (모듈 output을 루트에서 넘겨주기)
variable "shorten_invoke_arn" {
  type        = string
  description = "Invoke ARN of shorten lambda"
}

variable "shorten_function_name" {
  type        = string
  description = "Function name of shorten lambda"
}

variable "redirect_invoke_arn" {
  type        = string
  description = "Invoke ARN of redirect lambda"
}

variable "redirect_function_name" {
  type        = string
  description = "Function name of redirect lambda"
}

variable "cors_allow_origins" {
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  type        = list(string)
  default     = ["GET", "POST", "OPTIONS"]
}

variable "cors_allow_headers" {
  type        = list(string)
  default     = ["Content-Type"]
}

variable "stats_invoke_arn" {
  type        = string
  description = "Invoke ARN of stats lambda"
}

variable "stats_function_name" {
  type        = string
  description = "Function name of stats lambda"
}

variable "trends_latest_invoke_arn" { 
  type = string 
}
variable "trends_latest_function_name" { 
  type = string 
}