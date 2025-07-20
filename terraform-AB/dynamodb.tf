resource "aws_dynamodb_table" "availability" {
  name         = "Availability"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "scooterId"
  range_key    = "date"

  attribute {
    name = "scooterId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [read_capacity, write_capacity]
  }
}


resource "aws_dynamodb_table" "bookings" {
  name         = "Bookings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "bookingReference"

  attribute {
    name = "bookingReference"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [read_capacity, write_capacity]
  }
}
