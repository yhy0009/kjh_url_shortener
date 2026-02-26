variable "bucket_name" {
  description = "S3 bucket name for frontend static assets"
  type        = string
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

variable "force_destroy" {
  description = "Allow terraform to destroy bucket with objects inside"
  type        = bool
  default     = false
}

variable "enable_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "cloudfront_distribution_arn" {
  description = "If set, attach bucket policy to allow CloudFront (OAC) access via SourceArn"
  type        = string
  default     = null
}

variable "attach_cloudfront_policy" {
  description = "Attach bucket policy that allows CloudFront OAC access"
  type        = bool
  default     = false
}