output "distribution_id" {
  value       = aws_cloudfront_distribution.this.id
  description = "CloudFront distribution ID"
}

output "distribution_arn" {
  value       = aws_cloudfront_distribution.this.arn
  description = "CloudFront distribution ARN"
}

output "domain_name" {
  value       = aws_cloudfront_distribution.this.domain_name
  description = "CloudFront domain name (e.g. dxxxxx.cloudfront.net)"
}

output "hosted_zone_id" {
  value       = aws_cloudfront_distribution.this.hosted_zone_id
  description = "CloudFront hosted zone ID (for Route53 alias record)"
}
