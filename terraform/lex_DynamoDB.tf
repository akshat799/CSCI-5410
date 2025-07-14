resource "aws_dynamodb_table" "bookings" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingReference"

  attribute {
    name = "bookingReference"
    type = "S"
  }

  attribute {
    name = "accessCode"
    type = "S"
  }

  attribute {
    name = "duration"
    type = "N"
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
}