variable "aws_region" {
  default = "ap-northeast-2"
}

variable "project_name" {
  default = "kjh_url_shortener"
}

variable "tags" {
  type = map(string)
  default = {
    Project   = "short-url"
    ManagedBy = "terraform"
  }
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "root_domain" {
  type    = string
}

variable "frontend_domain" {
  type        = string
  description = "Custom domain to attach to CloudFront"
}