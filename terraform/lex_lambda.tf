locals {
  lex_lambdas = {
    register_help  = "${path.module}/../lambda-functions/register_help.py"
    find_booking   = "${path.module}/../lambda-functions/find_booking.py"
    submit_concern = "${path.module}/../lambda-functions/submit_concern.py"
  }
}

data "archive_file" "lex_lambda_zips" {
  for_each    = local.lex_lambdas
  type        = "zip"
  source_file = each.value
  output_path = "${path.module}/${each.key}.zip"
}

resource "aws_lambda_function" "lex_lambda" {
  for_each         = data.archive_file.lex_lambda_zips
  function_name    = each.key
  filename         = each.value.output_path
  handler          = "${replace(each.key, "_check", "")}.lambda_handler"
  runtime          = "python3.9"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = each.value.output_base64sha256
}
