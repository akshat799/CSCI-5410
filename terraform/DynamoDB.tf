resource "aws_dynamodb_table" "user_data" {
  name         = "UserData"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "security_questions" {
  name         = "SecurityQA"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "caesar_cipher" {
  name         = "CaesarChallenge"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "booking_info" {
  name         = "BookingInfo"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "booking_code"

  attribute {
    name = "booking_code"
    type = "S"
  }
}

resource "aws_dynamodb_table" "user_concerns" {
  name         = "UserConcerns"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ticket_id"

  attribute {
    name = "ticket_id"
    type = "S"
  }
}