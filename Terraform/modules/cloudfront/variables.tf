variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "origin_domain_name" {
  description = "S3 bucket regional domain name (e.g. xxx.s3.ap-northeast-2.amazonaws.com)"
  type        = string
}

variable "origin_id" {
  description = "CloudFront origin id"
  type        = string
  default     = "frontend-s3-origin"
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_200"
}

variable "enable_ipv6" {
  description = "Enable IPv6"
  type        = bool
  default     = true
}

variable "comment" {
  description = "CloudFront comment"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}

# ---- Custom domain / HTTPS (선택) ----
variable "aliases" {
  description = "Alternate domain names (CNAMEs) for the distribution"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain (must be in us-east-1 for CloudFront)"
  type        = string
  default     = null
}

# ---- SPA 라우팅 지원 (Next 정적/React Router 등) ----
variable "enable_spa_fallback" {
  description = "If true, map 403/404 to /index.html"
  type        = bool
  default     = true
}

# ---- Logging (선택) ----
variable "logging_bucket" {
  description = "S3 bucket domain name for access logs (e.g. mylogbucket.s3.amazonaws.com)"
  type        = string
  default     = null
}

variable "logging_prefix" {
  description = "Log prefix"
  type        = string
  default     = "cloudfront/"
}
