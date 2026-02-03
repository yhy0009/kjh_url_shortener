variable "project_name" {
  type        = string
  description = "Project name prefix for resource naming"
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

variable "enable_ttl" {
  type        = bool
  description = "Enable TTL on urls table"
  default     = false
}

variable "ttl_attribute_name" {
  type        = string
  description = "TTL attribute name (Number type in item data)"
  default     = "expiresAt"
}
