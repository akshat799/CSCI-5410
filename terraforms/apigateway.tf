resource "aws_api_gateway_rest_api" "api" {
  name        = "DALSScooterAPI"
  description = "API for DALSScooter application"
}

resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name                   = "CognitoAuthorizer"
  rest_api_id            = aws_api_gateway_rest_api.api.id
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [data.aws_cognito_user_pool.main.arn]
  identity_source        = "method.request.header.Authorization"
}

# API Gateway Resources
resource "aws_api_gateway_resource" "availability" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "availability"
}

resource "aws_api_gateway_resource" "bookings" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "bookings"
}

resource "aws_api_gateway_resource" "embed_url" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "embed-url"
}

# ===== CORS METHODS =====

# CORS for /availability
resource "aws_api_gateway_method" "availability_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "availability_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "availability_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "availability_options" {
  depends_on = [aws_api_gateway_integration.availability_options]

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.availability.id
  http_method = aws_api_gateway_method.availability_options.http_method
  status_code = aws_api_gateway_method_response.availability_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for /bookings
resource "aws_api_gateway_method" "bookings_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "bookings_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "bookings_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "bookings_options" {
  depends_on = [aws_api_gateway_integration.bookings_options]

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.bookings.id
  http_method = aws_api_gateway_method.bookings_options.http_method
  status_code = aws_api_gateway_method_response.bookings_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for /embed-url
resource "aws_api_gateway_method" "embed_url_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.embed_url.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "embed_url_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.embed_url_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "embed_url_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.embed_url_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "embed_url_options" {
  depends_on = [aws_api_gateway_integration.embed_url_options]

  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.embed_url_options.http_method
  status_code = aws_api_gateway_method_response.embed_url_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ===== API METHODS =====

# Add Availability
resource "aws_api_gateway_method" "add_availability" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "add_availability_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.availability.id
  http_method             = aws_api_gateway_method.add_availability.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["add_availability"].invoke_arn
}

# Get Availability
resource "aws_api_gateway_method" "get_availability" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "get_availability_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.availability.id
  http_method             = aws_api_gateway_method.get_availability.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["get_availability"].invoke_arn
}

# Book Slot
resource "aws_api_gateway_method" "book_slot" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "book_slot_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.bookings.id
  http_method             = aws_api_gateway_method.book_slot.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["book_slot"].invoke_arn
}

# Cancel Booking
resource "aws_api_gateway_method" "cancel_booking" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "cancel_booking_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.bookings.id
  http_method             = aws_api_gateway_method.cancel_booking.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["cancel_booking"].invoke_arn
}

# Get Bookings
resource "aws_api_gateway_method" "get_bookings" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.bookings.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "get_bookings_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.bookings.id
  http_method             = aws_api_gateway_method.get_bookings.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["get_bookings"].invoke_arn
}

# Update Availability
resource "aws_api_gateway_method" "update_availability" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.availability.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "update_availability_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.availability.id
  http_method             = aws_api_gateway_method.update_availability.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["update_availability"].invoke_arn
}

# Get Embed URL
resource "aws_api_gateway_method" "get_embed_url" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.embed_url.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "get_embed_url_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.embed_url.id
  http_method             = aws_api_gateway_method.get_embed_url.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda["get_embed_url"].invoke_arn
}

resource "aws_api_gateway_method_response" "get_embed_url_200" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "get_embed_url_200" {
  depends_on = [aws_api_gateway_integration.get_embed_url_lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = aws_api_gateway_method_response.get_embed_url_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

resource "aws_api_gateway_method_response" "get_embed_url_400" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = "400"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "get_embed_url_400" {
  depends_on = [aws_api_gateway_integration.get_embed_url_lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = aws_api_gateway_method_response.get_embed_url_400.status_code
  selection_pattern = ".*(Missing|Invalid).*"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

resource "aws_api_gateway_method_response" "get_embed_url_401" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = "401"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "get_embed_url_401" {
  depends_on = [aws_api_gateway_integration.get_embed_url_lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = aws_api_gateway_method_response.get_embed_url_401.status_code
  selection_pattern = ".*Unauthorized.*"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

resource "aws_api_gateway_method_response" "get_embed_url_403" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = "403"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "get_embed_url_403" {
  depends_on = [aws_api_gateway_integration.get_embed_url_lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = aws_api_gateway_method_response.get_embed_url_403.status_code
  selection_pattern = ".*Forbidden.*"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

resource "aws_api_gateway_method_response" "get_embed_url_500" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = "500"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "get_embed_url_500" {
  depends_on = [aws_api_gateway_integration.get_embed_url_lambda]
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.embed_url.id
  http_method = aws_api_gateway_method.get_embed_url.http_method
  status_code = aws_api_gateway_method_response.get_embed_url_500.status_code
  selection_pattern = ".*Error.*"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
  }
}

# Lambda Permissions for API Gateway (UNCHANGED for booking/availability)
resource "aws_lambda_permission" "add_availability_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["add_availability"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/POST/availability"
}

resource "aws_lambda_permission" "get_availability_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["get_availability"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/GET/availability"
}

resource "aws_lambda_permission" "book_slot_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["book_slot"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/POST/bookings"
}

resource "aws_lambda_permission" "cancel_booking_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["cancel_booking"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/DELETE/bookings"
}

resource "aws_lambda_permission" "get_bookings_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["get_bookings"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/GET/bookings"
}

resource "aws_lambda_permission" "update_availability_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["update_availability"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/PUT/availability"
}

resource "aws_lambda_permission" "get_embed_url_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["get_embed_url"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/GET/embed-url"
}

# Deploy API Gateway
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  depends_on = [
    aws_api_gateway_integration.add_availability_lambda,
    aws_api_gateway_integration.get_availability_lambda,
    aws_api_gateway_integration.book_slot_lambda,
    aws_api_gateway_integration.cancel_booking_lambda,
    aws_api_gateway_integration.get_bookings_lambda,
    aws_api_gateway_integration.update_availability_lambda,
    aws_api_gateway_integration.get_embed_url_lambda,
    aws_api_gateway_integration_response.availability_options,
    aws_api_gateway_integration_response.bookings_options,
    aws_api_gateway_integration_response.embed_url_options,
    aws_api_gateway_integration_response.get_embed_url_200,
    aws_api_gateway_integration_response.get_embed_url_400,
    aws_api_gateway_integration_response.get_embed_url_401,
    aws_api_gateway_integration_response.get_embed_url_403,
    aws_api_gateway_integration_response.get_embed_url_500
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.availability.id,
      aws_api_gateway_resource.bookings.id,
      aws_api_gateway_resource.embed_url.id,
      aws_api_gateway_method.add_availability.id,
      aws_api_gateway_method.get_availability.id,
      aws_api_gateway_method.book_slot.id,
      aws_api_gateway_method.cancel_booking.id,
      aws_api_gateway_method.get_bookings.id,
      aws_api_gateway_method.update_availability.id,
      aws_api_gateway_method.get_embed_url.id,
      aws_api_gateway_method.availability_options.id,
      aws_api_gateway_method.bookings_options.id,
      aws_api_gateway_method.embed_url_options.id,
      aws_api_gateway_integration.add_availability_lambda.id,
      aws_api_gateway_integration.get_availability_lambda.id,
      aws_api_gateway_integration.book_slot_lambda.id,
      aws_api_gateway_integration.cancel_booking_lambda.id,
      aws_api_gateway_integration.get_bookings_lambda.id,
      aws_api_gateway_integration.update_availability_lambda.id,
      aws_api_gateway_integration.get_embed_url_lambda.id,
      aws_api_gateway_integration.availability_options.id,
      aws_api_gateway_integration.bookings_options.id,
      aws_api_gateway_integration.embed_url_options.id,
      aws_api_gateway_method_response.get_embed_url_200.id,
      aws_api_gateway_method_response.get_embed_url_400.id,
      aws_api_gateway_method_response.get_embed_url_401.id,
      aws_api_gateway_method_response.get_embed_url_403.id,
      aws_api_gateway_method_response.get_embed_url_500.id,
      aws_api_gateway_authorizer.cognito_authorizer.id
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  stage_name    = "prod"
}