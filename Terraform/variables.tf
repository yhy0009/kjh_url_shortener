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
