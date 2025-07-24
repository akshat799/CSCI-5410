resource "aws_api_gateway_rest_api" "bike_api" {
  name        = "DALScooter-Bike-API"
  description = "API for bike management operations"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Add Cognito User Pool Authorizer
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name          = "CognitoUserPoolAuthorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  provider_arns = [aws_cognito_user_pool.main.arn]
}

# BIKE RESOURCES
resource "aws_api_gateway_resource" "bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_rest_api.bike_api.root_resource_id
  path_part   = "bikes"
}

resource "aws_api_gateway_resource" "bike_id" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_resource.bikes.id
  path_part   = "{bike_id}"
}

# Public bikes resource (no authentication required)
resource "aws_api_gateway_resource" "public_bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_rest_api.bike_api.root_resource_id
  path_part   = "public-bikes"
}

# FEEDBACK RESOURCES
resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_rest_api.bike_api.root_resource_id
  path_part   = "feedback"
}

resource "aws_api_gateway_resource" "feedback_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  parent_id   = aws_api_gateway_resource.feedback.id
  path_part   = "{bike_id}"
}

# ===== BIKE METHODS =====

# POST /bikes (create bike) - WITH COGNITO AUTH
resource "aws_api_gateway_method" "create_bike" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "create_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.create_bike.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["bike_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "create_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.create_bike.http_method
  status_code = "201"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# GET /bikes (list bikes) - WITH COGNITO AUTH
resource "aws_api_gateway_method" "get_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "get_bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.get_bikes.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["bike_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "get_bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.get_bikes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# GET /public-bikes (no authentication required)
resource "aws_api_gateway_method" "get_public_bikes" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.public_bikes.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_public_bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.public_bikes.id
  http_method = aws_api_gateway_method.get_public_bikes.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["get_bikes_public"].invoke_arn
}

resource "aws_api_gateway_method_response" "get_public_bikes" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.public_bikes.id
  http_method = aws_api_gateway_method.get_public_bikes.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# PUT /bikes/{bike_id} (update bike) - WITH COGNITO AUTH
resource "aws_api_gateway_method" "update_bike" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "update_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.update_bike.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["bike_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "update_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.update_bike.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# DELETE /bikes/{bike_id} (delete bike) - WITH COGNITO AUTH
resource "aws_api_gateway_method" "delete_bike" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "delete_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.delete_bike.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["bike_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "delete_bike" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.delete_bike.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# ===== FEEDBACK METHODS =====

# POST /feedback (submit feedback) - WITH COGNITO AUTH
resource "aws_api_gateway_method" "submit_feedback" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "submit_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.submit_feedback.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["feedback_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "submit_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.submit_feedback.http_method
  status_code = "201"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# GET /feedback (get all feedback) - NO AUTH REQUIRED (public)
resource "aws_api_gateway_method" "get_feedback" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.get_feedback.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["feedback_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "get_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.get_feedback.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# GET /feedback/{bike_id} (get feedback for specific bike) - NO AUTH REQUIRED (public)
resource "aws_api_gateway_method" "get_bike_feedback" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.feedback_bike.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_bike_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback_bike.id
  http_method = aws_api_gateway_method.get_bike_feedback.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.lambda["feedback_management"].invoke_arn
}

resource "aws_api_gateway_method_response" "get_bike_feedback" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback_bike.id
  http_method = aws_api_gateway_method.get_bike_feedback.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

# ===== CORS METHODS =====

# Enable CORS for /bikes
resource "aws_api_gateway_method" "bikes_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bikes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "bikes_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "bikes_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "bikes_options" {
  depends_on = [aws_api_gateway_integration.bikes_options]
  
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bikes.id
  http_method = aws_api_gateway_method.bikes_options.http_method
  status_code = aws_api_gateway_method_response.bikes_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for /bikes/{bike_id}
resource "aws_api_gateway_method" "bike_id_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.bike_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "bike_id_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.bike_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "bike_id_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.bike_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "bike_id_options" {
  depends_on = [aws_api_gateway_integration.bike_id_options]
  
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.bike_id.id
  http_method = aws_api_gateway_method.bike_id_options.http_method
  status_code = aws_api_gateway_method_response.bike_id_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for public bikes
resource "aws_api_gateway_method" "public_bikes_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.public_bikes.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "public_bikes_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.public_bikes.id
  http_method = aws_api_gateway_method.public_bikes_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "public_bikes_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.public_bikes.id
  http_method = aws_api_gateway_method.public_bikes_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "public_bikes_options" {
  depends_on = [aws_api_gateway_integration.public_bikes_options]
  
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.public_bikes.id
  http_method = aws_api_gateway_method.public_bikes_options.http_method
  status_code = aws_api_gateway_method_response.public_bikes_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for /feedback
resource "aws_api_gateway_method" "feedback_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_options" {
  depends_on = [aws_api_gateway_integration.feedback_options]
  
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = aws_api_gateway_method_response.feedback_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS for /feedback/{bike_id}
resource "aws_api_gateway_method" "feedback_bike_options" {
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  resource_id   = aws_api_gateway_resource.feedback_bike.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_bike_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback_bike.id
  http_method = aws_api_gateway_method.feedback_bike_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "feedback_bike_options" {
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback_bike.id
  http_method = aws_api_gateway_method.feedback_bike_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "feedback_bike_options" {
  depends_on = [aws_api_gateway_integration.feedback_bike_options]
  
  rest_api_id = aws_api_gateway_rest_api.bike_api.id
  resource_id = aws_api_gateway_resource.feedback_bike.id
  http_method = aws_api_gateway_method.feedback_bike_options.http_method
  status_code = aws_api_gateway_method_response.feedback_bike_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ===== DEPLOYMENT =====

# Deployment
resource "aws_api_gateway_deployment" "bike_api" {
  depends_on = [
    aws_api_gateway_integration.create_bike,
    aws_api_gateway_integration.get_bikes,
    aws_api_gateway_integration.update_bike,
    aws_api_gateway_integration.delete_bike,
    aws_api_gateway_integration.get_public_bikes,
    aws_api_gateway_integration.submit_feedback,
    aws_api_gateway_integration.get_feedback,
    aws_api_gateway_integration.get_bike_feedback,
    aws_api_gateway_integration_response.bikes_options,
    aws_api_gateway_integration_response.bike_id_options,
    aws_api_gateway_integration_response.public_bikes_options,
    aws_api_gateway_integration_response.feedback_options,
    aws_api_gateway_integration_response.feedback_bike_options,
    aws_api_gateway_method_response.create_bike,
    aws_api_gateway_method_response.get_bikes,
    aws_api_gateway_method_response.update_bike,
    aws_api_gateway_method_response.delete_bike,
    aws_api_gateway_method_response.get_public_bikes,
    aws_api_gateway_method_response.submit_feedback,
    aws_api_gateway_method_response.get_feedback,
    aws_api_gateway_method_response.get_bike_feedback
  ]

  rest_api_id = aws_api_gateway_rest_api.bike_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.bikes.id,
      aws_api_gateway_resource.bike_id.id,
      aws_api_gateway_resource.public_bikes.id,
      aws_api_gateway_resource.feedback.id,
      aws_api_gateway_resource.feedback_bike.id,
      aws_api_gateway_method.create_bike.id,
      aws_api_gateway_method.get_bikes.id,
      aws_api_gateway_method.update_bike.id,
      aws_api_gateway_method.delete_bike.id,
      aws_api_gateway_method.get_public_bikes.id,
      aws_api_gateway_method.submit_feedback.id,
      aws_api_gateway_method.get_feedback.id,
      aws_api_gateway_method.get_bike_feedback.id,
      aws_api_gateway_integration.create_bike.id,
      aws_api_gateway_integration.get_bikes.id,
      aws_api_gateway_integration.update_bike.id,
      aws_api_gateway_integration.delete_bike.id,
      aws_api_gateway_integration.get_public_bikes.id,
      aws_api_gateway_integration.submit_feedback.id,
      aws_api_gateway_integration.get_feedback.id,
      aws_api_gateway_integration.get_bike_feedback.id,
      aws_api_gateway_authorizer.cognito_authorizer.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "bike_api_stage" {
  deployment_id = aws_api_gateway_deployment.bike_api.id
  rest_api_id   = aws_api_gateway_rest_api.bike_api.id
  stage_name    = "prod"

  xray_tracing_enabled = true
}

# ===== LAMBDA PERMISSIONS =====

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["bike_management"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

# Lambda permission for public bikes API Gateway
resource "aws_lambda_permission" "api_gateway_public_bikes" {
  statement_id  = "AllowExecutionFromAPIGatewayPublicBikes"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["get_bikes_public"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

# Lambda permissions for feedback API
resource "aws_lambda_permission" "feedback_api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGatewayFeedback"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["feedback_management"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.bike_api.execution_arn}/*/*"
}

# ===== DATA SOURCES =====

# Data source for current region (fix for deprecated warning)
data "aws_region" "current" {}

# ===== OUTPUTS =====

# Outputs with fixed region reference
output "bike_api_url" {
  description = "Base URL for the Bike Management API"
  value       = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}"
}

output "api_endpoints" {
  description = "Available API endpoints"
  value = {
    "Create Bike"      = "POST https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes"
    "List Bikes"       = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes"
    "Public Bikes"     = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/public-bikes"
    "Update Bike"      = "PUT https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes/{bike_id}"
    "Delete Bike"      = "DELETE https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/bikes/{bike_id}"
    "Submit Feedback"  = "POST https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback"
    "Get All Feedback" = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback"
    "Get Bike Feedback" = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback/{bike_id}"
  }
}

output "feedback_api_endpoints" {
  description = "Feedback API endpoints with sentiment analysis"
  value = {
    "Submit Feedback"   = "POST https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback (Auth Required)"
    "Get All Feedback"  = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback (Public)"
    "Get Bike Feedback" = "GET https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}/feedback/{bike_id} (Public)"
  }
}

output "cognito_authorizer_info" {
  description = "Cognito Authorizer Information"
  value = {
    "authorizer_id"   = aws_api_gateway_authorizer.cognito_authorizer.id
    "user_pool_arn"   = aws_cognito_user_pool.main.arn
    "user_pool_id"    = aws_cognito_user_pool.main.id
    "client_id"       = aws_cognito_user_pool_client.client.id
  }
}