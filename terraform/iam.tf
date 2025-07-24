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

resource "aws_iam_role_policy_attachment" "lambda_basic_exec_mfa" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

<<<<<<< HEAD
resource "aws_iam_role_policy_attachment" "lambda_basic_exec_mfa" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

=======
>>>>>>> upstream/main

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
<<<<<<< HEAD
  statement_id_prefix = "AllowCognitoPostConfirmation"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda["post_confirmation"].function_name
  principal           = "cognito-idp.amazonaws.com"
  source_arn          = aws_cognito_user_pool.main.arn
=======
  statement_id  = "AllowCognitoPostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["post_confirmation"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
>>>>>>> upstream/main
}

resource "aws_iam_role_policy" "allow_admin_add_user_to_group" {
  name = "AllowAdminAddUserToGroup"
  role = aws_iam_role.lambda_role.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
<<<<<<< HEAD
        Effect = "Allow",
        Action = [
=======
        Effect   = "Allow",
        Action   = [
>>>>>>> upstream/main
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup"
        ],
        Resource = aws_cognito_user_pool.main.arn
      }
    ]
  })
<<<<<<< HEAD
=======
}

resource "aws_iam_role_policy" "lambda_bikes_table_access" {
  name = "LambdaBikesTableAccess"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Resource = [
          aws_dynamodb_table.bikes.arn,
          "${aws_dynamodb_table.bikes.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_feedback_table_access" {
  name = "LambdaFeedbackTableAccess"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Resource = [
          aws_dynamodb_table.feedback.arn,
          "${aws_dynamodb_table.feedback.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_comprehend_access" {
  name = "LambdaComprehendAccess"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "comprehend:DetectSentiment",
          "comprehend:DetectKeyPhrases",
          "comprehend:DetectEntities"
        ],
        Resource = "*"
      }
    ]
  })
>>>>>>> upstream/main
}