locals {
  lambdas = {
    add_availability    = "../lambda-functions/add_availability.py"
    get_availability    = "../lambda-functions/get_availability.py"
    book_slot           = "../lambda-functions/book_slot.py"
    cancel_booking      = "../lambda-functions/cancel_booking.py"
    get_bookings        = "../lambda-functions/get_bookings.py"
    update_availability = "../lambda-functions/update_availability.py"
  }
}

data "archive_file" "lambda_zips" {
  for_each    = local.lambdas
  type        = "zip"
  source_file = each.value
  output_path = "${path.module}/${each.key}.zip"
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
  for_each         = data.archive_file.lambda_zips
  function_name    = each.key
  filename         = each.value.output_path
  source_code_hash = each.value.output_base64sha256
  handler          = "${each.key}.lambda_handler"
  runtime          = "python3.12"
  role             = aws_iam_role.lambda_role.arn

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [source_code_hash, filename]
  }
}
