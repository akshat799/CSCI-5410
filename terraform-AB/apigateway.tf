resource "aws_api_gateway_rest_api" "dalscooter_api" {
  name        = "DALScooterBookingAPI"
  description = "API Gateway for scooter availability and booking"
}

resource "aws_api_gateway_resource" "booking_resource" {
  rest_api_id = aws_api_gateway_rest_api.dalscooter_api.id
  parent_id   = aws_api_gateway_rest_api.dalscooter_api.root_resource_id
  path_part   = "booking"
}

locals {
  lambda_routes = {
    add_availability    = { method = "POST", path = "add" }
    get_availability    = { method = "POST", path = "get" }
    book_slot           = { method = "POST", path = "bookSlot" }
    cancel_booking      = { method = "POST", path = "cancel" }
    get_bookings        = { method = "GET", path = "bookings" }
    update_availability = { method = "POST", path = "update" }
  }
}

resource "aws_api_gateway_resource" "lambda_endpoints" {
  for_each    = local.lambda_routes
  rest_api_id = aws_api_gateway_rest_api.dalscooter_api.id
  parent_id   = aws_api_gateway_resource.booking_resource.id
  path_part   = each.value.path
}

resource "aws_api_gateway_method" "lambda_methods" {
  for_each      = local.lambda_routes
  rest_api_id   = aws_api_gateway_rest_api.dalscooter_api.id
  resource_id   = aws_api_gateway_resource.lambda_endpoints[each.key].id
  http_method   = each.value.method
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integrations" {
  for_each                = local.lambda_routes
  rest_api_id             = aws_api_gateway_rest_api.dalscooter_api.id
  resource_id             = aws_api_gateway_resource.lambda_endpoints[each.key].id
  http_method             = aws_api_gateway_method.lambda_methods[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.lambda[each.key].invoke_arn
}

resource "aws_lambda_permission" "api_gateway_permissions" {
  for_each            = local.lambda_routes
  statement_id_prefix = "AllowAPIGatewayInvoke_${each.key}"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.lambda[each.key].function_name
  principal           = "apigateway.amazonaws.com"
  source_arn          = "${aws_api_gateway_rest_api.dalscooter_api.execution_arn}/*/*"

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [statement_id]
  }
}

resource "aws_api_gateway_deployment" "dalscooter_deploy" {
  depends_on = [
    aws_api_gateway_integration.lambda_integrations["add_availability"],
    aws_api_gateway_integration.lambda_integrations["get_availability"],
    aws_api_gateway_integration.lambda_integrations["book_slot"],
    aws_api_gateway_integration.lambda_integrations["cancel_booking"],
    aws_api_gateway_integration.lambda_integrations["get_bookings"],
    aws_api_gateway_integration.lambda_integrations["update_availability"]
  ]

  rest_api_id = aws_api_gateway_rest_api.dalscooter_api.id

  triggers = {
    redeploy_hash = timestamp()
  }
}

resource "aws_api_gateway_stage" "prod" {
  stage_name    = "prod"
  rest_api_id   = aws_api_gateway_rest_api.dalscooter_api.id
  deployment_id = aws_api_gateway_deployment.dalscooter_deploy.id
}

output "api_base_url" {
  value       = "https://${aws_api_gateway_rest_api.dalscooter_api.id}.execute-api.us-east-1.amazonaws.com/prod"
  description = "Base URL of the deployed API Gateway"
}
