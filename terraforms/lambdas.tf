resource "aws_lambda_function" "add_availability" {
  filename         = "../lambda/add_availability.zip"
  function_name    = "AddAvailability"
  role             = aws_iam_role.lambda_role.arn
  handler          = "add_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/add_availability.zip")
  timeout          = 30
}

resource "aws_lambda_function" "get_availability" {
  filename         = "../lambda/get_availability.zip"
  function_name    = "GetAvailability"
  role             = aws_iam_role.lambda_role.arn
  handler          = "get_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/get_availability.zip")
  timeout          = 30
}

resource "aws_lambda_function" "book_slot" {
  filename         = "../lambda/book_slot.zip"
  function_name    = "BookSlot"
  role             = aws_iam_role.lambda_role.arn
  handler          = "book_slot.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/book_slot.zip")
  timeout          = 30
}

resource "aws_lambda_function" "cancel_booking" {
  filename         = "../lambda/cancel_booking.zip"
  function_name    = "CancelBooking"
  role             = aws_iam_role.lambda_role.arn
  handler          = "cancel_booking.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/cancel_booking.zip")
  timeout          = 30
}

resource "aws_lambda_function" "get_bookings" {
  filename         = "../lambda/get_bookings.zip"
  function_name    = "GetBookings"
  role             = aws_iam_role.lambda_role.arn
  handler          = "get_bookings.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/get_bookings.zip")
  timeout          = 30
}

resource "aws_lambda_function" "update_availability" {
  filename         = "../lambda/update_availability.zip"
  function_name    = "UpdateAvailability"
  role             = aws_iam_role.lambda_role.arn
  handler          = "update_availability.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("../lambda/update_availability.zip")
  timeout          = 30
}