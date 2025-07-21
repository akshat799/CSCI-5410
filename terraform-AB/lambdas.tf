locals {
  lambda_zips = {
    add_availability    = "add_availability.zip"
    get_availability    = "get_availability.zip"
    book_slot           = "book_slot.zip"
    cancel_booking      = "cancel_booking.zip"
    get_bookings        = "get_bookings.zip"
    update_availability = "update_availability.zip"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_role_booking_ab"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_lambda_function" "lambda" {
  for_each         = local.lambda_zips
  function_name    = each.key
  filename         = "${path.module}/zips/${each.value}"
  source_code_hash = filebase64sha256("${path.module}/zips/${each.value}")
  handler          = "${each.key}.lambda_handler"
  runtime          = "python3.12"
  role = "arn:aws:iam::370161336954:role/lambda_mfa_role"
  timeout = 10
  layers = [
    "arn:aws:lambda:us-east-1:370161336954:layer:jwt-crypto-layer:1"
  ]
}
