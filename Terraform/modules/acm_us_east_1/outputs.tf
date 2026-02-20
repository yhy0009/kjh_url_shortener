output "certificate_arn" {
  description = "Validated ACM certificate ARN"
  value       = aws_acm_certificate_validation.this.certificate_arn
}

output "certificate_arn_raw" {
  description = "Raw ACM certificate ARN (may be pending validation)"
  value       = aws_acm_certificate.this.arn
}