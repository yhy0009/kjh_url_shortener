variable "domain_name" {
  type        = string
  description = "Domain name to issue certificate for (e.g. short.example.com)"
}

variable "subject_alternative_names" {
  type        = list(string)
  default     = []
  description = "Optional SANs"
}

variable "zone_id" {
  type        = string
  description = "Route53 Hosted Zone ID where DNS validation records will be created"
}

variable "tags" {
  type    = map(string)
  default = {}
}