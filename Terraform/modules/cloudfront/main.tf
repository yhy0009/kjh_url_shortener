resource "aws_cloudfront_origin_access_control" "this" {
  name                              = "${var.project_name}-frontend-oac"
  description                       = "OAC for frontend S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Cache Policy: 정적 자산 캐시 최적화 (기본)
# - 쿼리/헤더/쿠키 최소화로 캐시 효율 ↑
resource "aws_cloudfront_cache_policy" "static" {
  name        = "${var.project_name}-frontend-static-cache"
  comment     = "Static assets cache policy"
  default_ttl = 86400        # 1d
  max_ttl     = 31536000     # 365d
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Origin Request Policy: 원본에 전달할 값 최소화
resource "aws_cloudfront_origin_request_policy" "minimal" {
  name    = "${var.project_name}-frontend-minimal-origin-req"
  comment = "Minimal origin request policy for S3 static hosting"

  cookies_config {
    cookie_behavior = "none"
  }

  headers_config {
    header_behavior = "none"
  }

  query_strings_config {
    query_string_behavior = "none"
  }
}

locals {
  use_custom_cert = var.acm_certificate_arn != null && length(var.aliases) > 0
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = var.enable_ipv6
  comment         = var.comment != "" ? var.comment : "${var.project_name} frontend CDN"
  price_class     = var.price_class

  aliases = local.use_custom_cert ? var.aliases : []

  origin {
    domain_name              = var.origin_domain_name
    origin_id                = var.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.this.id
  }

  default_root_object = var.default_root_object

  default_cache_behavior {
    target_origin_id       = var.origin_id
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]

    compress = true

    cache_policy_id          = aws_cloudfront_cache_policy.static.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.minimal.id
  }

  # SPA fallback (Next static + client routing)
  dynamic "custom_error_response" {
    for_each = var.enable_spa_fallback ? toset([403, 404]) : toset([])
    content {
      error_code            = custom_error_response.value
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = local.use_custom_cert ? false : true

    acm_certificate_arn            = local.use_custom_cert ? var.acm_certificate_arn : null
    ssl_support_method             = local.use_custom_cert ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_cert ? "TLSv1.2_2021" : "TLSv1"
  }

  # Logging (optional)
  dynamic "logging_config" {
    for_each = var.logging_bucket == null ? [] : [1]
    content {
      bucket          = var.logging_bucket
      include_cookies = false
      prefix          = var.logging_prefix
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-frontend-cdn"
  })
}
