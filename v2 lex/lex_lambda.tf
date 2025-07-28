locals {
  lex_lambdas = {
    register_help  = "${path.module}/../lambda-functions/register_help.py"
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

resource "aws_iam_role" "lex_lambda_role" {
  name = "lex_lambda_execution_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}