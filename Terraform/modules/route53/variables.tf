variable "domain_name" {
  description = "Hosted Zone root domain (e.g. kjh.shop)"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}

variable "create_alias" {
  description = "Create A/AAAA alias record to CloudFront"
  type        = bool
  default     = false
}

variable "record_name" {
  description = "Record name (e.g. r53-kjh.shop or 'www'). Use full domain recommended."
  type        = string
  default     = null
}

variable "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (e.g. d111111abcdef8.cloudfront.net)"
  type        = string
  default     = null
}

variable "cloudfront_zone_id" {
  description = "CloudFront hosted zone id (usually Z2FDTNDATAQYW2)"
  type        = string
  default     = null
}