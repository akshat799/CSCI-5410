resource "aws_dynamodb_table" "bikes" {
  name         = "Bikes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bike_id"

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "TypeIndex"
    hash_key        = "type"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    projection_type = "ALL"
  }
}
