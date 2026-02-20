resource "aws_route53_zone" "this" {
  name = var.domain_name
  tags = merge(var.tags, { Name = "zone-${var.domain_name}" })
}

resource "aws_route53_record" "cf_a" {
  count   = var.create_alias ? 1 : 0
  zone_id = aws_route53_zone.this.zone_id
  name    = var.record_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cf_aaaa" {
  count   = var.create_alias ? 1 : 0
  zone_id = aws_route53_zone.this.zone_id
  name    = var.record_name
  type    = "AAAA"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_zone_id
    evaluate_target_health = false
  }
}