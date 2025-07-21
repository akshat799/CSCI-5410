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
  name = "lambda_role_booking_av"

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

resource "aws_iam_role_policy_attachment" "basic_execution_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "lambda" {
  for_each         = local.lambda_zips
  function_name    = each.key
  filename         = "${path.module}/../lambdas/${each.value}"
  source_code_hash = filebase64sha256("${path.module}/../lambdas/${each.value}")

  handler          = "${each.key}.handler"     # Node.js uses <filename>.handler
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_role.arn

  timeout = 10
}
