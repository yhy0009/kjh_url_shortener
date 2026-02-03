resource "aws_dynamodb_table" "urls" {
  name         = "${var.project_name}-urls"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shortId"

  attribute {
    name = "shortId"
    type = "S"
  }

  dynamic "ttl" {
    for_each = var.enable_ttl ? [1] : []
    content {
      attribute_name = var.ttl_attribute_name
      enabled        = true
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-urls"
  })
}

resource "aws_dynamodb_table" "clicks" {
  name         = "${var.project_name}-clicks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "shortId"
  range_key    = "timestamp"

  attribute {
    name = "shortId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-clicks"
  })
}
