resource "aws_iam_role" "lambda_role" {
  name = "lambda_mfa_role"
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

resource "aws_iam_role_policy_attachment" "lambda_dynamo_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
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

resource "aws_iam_role_policy_attachment" "lex_lambda_policy" {
  role       = aws_iam_role.lex_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lex_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec_mfa" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_lambda_permission" "define_auth_permission" {
  statement_id_prefix = "AllowCognitoDefineAuth"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda["define_auth"].function_name
  principal           = "cognito-idp.amazonaws.com"
  source_arn          = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "create_auth_permission" {
  statement_id_prefix = "AllowCognitoCreateAuth"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda["create_auth"].function_name
  principal           = "cognito-idp.amazonaws.com"
  source_arn          = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "verify_auth_permission" {
  statement_id_prefix = "AllowCognitoVerifyAuth"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda["verify_auth"].function_name
  principal           = "cognito-idp.amazonaws.com"
  source_arn          = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "post_confirmation_permission" {
  statement_id_prefix = "AllowCognitoPostConfirmation"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda["post_confirmation"].function_name
  principal           = "cognito-idp.amazonaws.com"
  source_arn          = aws_cognito_user_pool.main.arn
}