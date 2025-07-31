provider "aws" {
  region  = "us-east-1"
  profile = "amplify-user-dalscooter"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

  output "api_gateway_url" {
    description = "Base URL for the API Gateway"
    value       = "https://${aws_api_gateway_rest_api.bike_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.bike_api_stage.stage_name}"
  }
