resource "aws_dynamodb_table" "users" {
  name         = "Users"
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

resource "aws_dynamodb_table" "feedback" {
  name         = "CustomerFeedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedback_id"

  attribute {
    name = "feedback_id"
    type = "S"
  }

  attribute {
    name = "bike_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "BikeIdIndex"
    hash_key        = "bike_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "CustomerIdIndex"
    hash_key        = "customer_id"
    projection_type = "ALL"
  }
}

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
