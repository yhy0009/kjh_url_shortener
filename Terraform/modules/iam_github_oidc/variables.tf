variable "project_name" {
  type        = string
  description = "Project name prefix"
}

variable "repo" {
  type        = string
  description = "GitHub repo in OWNER/REPO form (e.g. yhy0009/kjh_url_shortener)"
}

variable "branch" {
  type        = string
  description = "Allowed branch name"
  default     = "main"
}

variable "bucket_arn" {
  type        = string
  description = "Frontend S3 bucket ARN"
}

variable "cloudfront_distribution_arn" {
  type        = string
  description = "CloudFront distribution ARN"
}

variable "tags" {
  type        = map(string)
  description = "Tags"
  default     = {}
}
