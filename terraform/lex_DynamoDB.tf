resource "aws_dynamodb_table" "bookings" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingReference"

  attribute {
    name = "bookingReference"
    type = "S"
  }
}


resource "aws_dynamodb_table" "concerns" {
  name           = "Concerns"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "concernId"

  attribute {
    name = "concernId"
    type = "S"
  }

  attribute {
    name = "bookingReference"
    type = "S"
  }

  global_secondary_index {
    name               = "BookingReferenceIndex"
    hash_key           = "bookingReference"
    projection_type    = "ALL"
  }
}

