resource "aws_cognito_user_pool" "main" {
  name = "UserPool"

  lambda_config {
    define_auth_challenge = aws_lambda_function.lambda["define_auth"].arn
    create_auth_challenge = aws_lambda_function.lambda["create_auth"].arn
    verify_auth_challenge_response = aws_lambda_function.lambda["verify_auth"].arn
    post_confirmation = aws_lambda_function.lambda["post_confirmation"].arn
  }

  auto_verified_attributes = ["email"]

  schema {
    name = "email"
    required = true
    attribute_data_type = "String"
  }

  schema {
    name = "secQuestion"
    attribute_data_type = "String"
    mutable = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name = "secAnswer"
    attribute_data_type = "String"
    mutable = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name = "role"
    attribute_data_type = "String"
    mutable = true
  }

  schema {
    name = "caesarText"
    attribute_data_type = "String"
    mutable = true
  }
  schema {
    name = "shiftKey"
    attribute_data_type = "Number"
    required = false
    mutable = true
  }

  password_policy {
    minimum_length = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers = true
    require_symbols = false
  }
}

resource "aws_lambda_permission" "allow_cognito_post_confirmation" {
  statement_id  = "AllowExecutionFromCognitoPostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["post_confirmation"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
resource "aws_cognito_user_pool_client" "client" {
  name = "UserPoolClient"
  user_pool_id = aws_cognito_user_pool.main.id
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}

resource "aws_lambda_permission" "allow_cognito_define" {
  statement_id  = "AllowExecutionFromCognitoDefine"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["define_auth"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "allow_cognito_create" {
  statement_id  = "AllowExecutionFromCognitoCreate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["create_auth"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_lambda_permission" "allow_cognito_verify" {
  statement_id  = "AllowExecutionFromCognitoVerify"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["verify_auth"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
resource "aws_cognito_user_group" "registered_customer" {
  name         = "RegisteredCustomer"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Users who have signed up and passed MFA—can book e-bikes and use the virtual assistant"  
  precedence   = 50
}

resource "aws_cognito_user_group" "franchise_operator" {
  name         = "FranchiseOperator"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users—can add/update scooters, view all bookings, and communicate with customers"
  precedence   = 10
}