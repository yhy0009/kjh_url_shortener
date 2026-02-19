output "role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "Assume role ARN for GitHub Actions (AWS_ROLE_TO_ASSUME)"
}

output "role_name" {
  value       = aws_iam_role.github_actions.name
  description = "Role name"
}
