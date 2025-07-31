# DynamoDB Tables
resource "aws_dynamodb_table" "availability" {
  name           = "Availability"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bike_id"
  range_key      = "slot_id"

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "slot_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "bookings" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "booking_reference"

  attribute {
    name = "booking_reference"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
    read_capacity      = 0  # PAY_PER_REQUEST
    write_capacity     = 0  # PAY_PER_REQUEST
  }
}

data "aws_dynamodb_table" "logins" {
  name = "Logins"
}