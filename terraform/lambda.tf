locals {
  lambdas = {
    define_auth = "${path.module}/../lambda-functions/define_auth.py"
    create_auth = "${path.module}/../lambda-functions/create_auth.py"
    verify_auth = "${path.module}/../lambda-functions/verify_auth.py"
    qa_check = "${path.module}/../lambda-functions/lambda_qa.py"
    caesar_check  = "${path.module}/../lambda-functions/lambda_caesar.py"
    
    add_availability  = "${path.module}/../lambda-functions/add_availability.py"
    get_availability  = "${path.module}/../lambda-functions/get_availability.py"
    book_slot         = "${path.module}/../lambda-functions/book_slot.py"
    cancel_booking    = "${path.module}/../lambda-functions/cancel_booking.py"
    get_bookings      = "${path.module}/../lambda-functions/get_bookings.py"
    update_availability = "${path.module}/../lambda-functions/update_availability.py"  
  }
}

data "archive_file" "lambda_zips" {
  for_each = local.lambdas
  type = "zip"
  source_file = each.value
  output_path = "${path.module}/${each.key}.zip"
}

resource "aws_lambda_function" "lambda" {
  for_each = data.archive_file.lambda_zips
  function_name = each.key
  filename = each.value.output_path
  handler = "${replace(each.key, "_check", "")}.lambda_handler"
  runtime = "python3.9"
  role = aws_iam_role.lambda_role.arn
  source_code_hash = each.value.output_base64sha256
}
