provider "aws" {
  region = "us-east-1"
  profile = "amplify-user-dalscooter"
}

output "api_gateway_url" {
  description = "Base URL for the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}"
}

output "booking_request_lambda_arn" {
  value = aws_lambda_function.lambda["booking_request"].invoke_arn
}

output "booking_request_lambda_name" {
  value = aws_lambda_function.lambda["booking_request"].function_name
}
