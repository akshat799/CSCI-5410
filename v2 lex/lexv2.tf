provider "aws" {
  region = "us-east-1"
}

# =====================
# DynamoDB Tables
# =====================
resource "aws_dynamodb_table" "help_requests" {
  name         = "HelpRequests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "request_id"

  attribute {
    name = "request_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "bookings" {
  name         = "Bookings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "booking_id"

  attribute {
    name = "booking_id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "concerns" {
  name         = "Concerns"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "concern_id"

  attribute {
    name = "concern_id"
    type = "S"
  }
}

# =====================
# IAM Role and Policies
# =====================
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "lambda_exec_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.help_requests.arn,
      aws_dynamodb_table.bookings.arn,
      aws_dynamodb_table.concerns.arn
    ]
  }

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name   = "lambda_combined_dynamodb_policy"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# =====================
# Lambda Function
# =====================
resource "aws_lambda_function" "lex_handler" {
  function_name = "LexUnifiedHandler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.12"

  filename         = "${path.module}/lex_handler.zip"
  source_code_hash = filebase64sha256("${path.module}/lex_handler.zip")

  environment {
    variables = {
      HELP_TABLE     = aws_dynamodb_table.help_requests.name
      BOOKING_TABLE  = aws_dynamodb_table.bookings.name
      CONCERN_TABLE  = aws_dynamodb_table.concerns.name
    }
  }
}
