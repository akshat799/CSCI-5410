terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region  = var.region
  profile = "amplify-user-dalscooter"
}

#—— VARIABLES ——————————————————————————————————————————

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "api_name" {
  description = "Name of your existing API Gateway REST API"
  type        = string
}

variable "stage_name" {
  description = "Stage to deploy to (e.g. prod)"
  type        = string
  default     = "prod"
}

#—— DATA SOURCES ————————————————————————————————————————

data "aws_caller_identity" "current" {}

data "aws_api_gateway_rest_api" "existing" {
  name = var.api_name
}

data "aws_api_gateway_resource" "concerns" {
  rest_api_id = data.aws_api_gateway_rest_api.existing.id
  path        = "/concerns"
}

data "archive_file" "get_concerns" {
  type        = "zip"
  source_file = "${path.module}/../lambda-functions/get_concerns.py"
  output_path = "${path.module}/get_concerns.zip"
}

#—— IAM ROLE & POLICIES ——————————————————————————————

resource "aws_iam_role" "lambda_concerns_role" {
  name = "lambda_concerns_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_concerns_policy" {
  name = "lambda_concerns_policy"
  role = aws_iam_role.lambda_concerns_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:Scan"],
        Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/Concerns"
      },
      {
        Effect   = "Allow",
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

#—— LAMBDA FUNCTION ————————————————————————————————————

resource "aws_lambda_function" "concerns" {
  function_name    = "GetAllConcerns"
  filename         = data.archive_file.get_concerns.output_path
  source_code_hash = data.archive_file.get_concerns.output_base64sha256

  handler = "get_concerns.lambda_handler"
  runtime = "python3.9"
  role    = aws_iam_role.lambda_concerns_role.arn

  environment {
    variables = {
      CONCERNS_TABLE = "Concerns"
    }
  }
}

#—— API GATEWAY: GET /concerns ——————————————————————————

resource "aws_api_gateway_method" "get_concerns" {
  rest_api_id   = data.aws_api_gateway_rest_api.existing.id
  resource_id   = data.aws_api_gateway_resource.concerns.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_concerns" {
  rest_api_id             = data.aws_api_gateway_rest_api.existing.id
  resource_id             = data.aws_api_gateway_resource.concerns.id
  http_method             = aws_api_gateway_method.get_concerns.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.concerns.invoke_arn
}

resource "aws_lambda_permission" "allow_apigw_invoke_concerns_get" {
  statement_id  = "AllowAPIGatewayInvoke_GetAllConcerns_GET"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.concerns.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.existing.execution_arn}/*/GET/concerns"
}

#—— API GATEWAY: OPTIONS /concerns (CORS preflight) ——————————

resource "aws_api_gateway_method" "options_concerns" {
  rest_api_id   = data.aws_api_gateway_rest_api.existing.id
  resource_id   = data.aws_api_gateway_resource.concerns.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_concerns" {
  rest_api_id             = data.aws_api_gateway_rest_api.existing.id
  resource_id             = data.aws_api_gateway_resource.concerns.id
  http_method             = aws_api_gateway_method.options_concerns.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.concerns.invoke_arn
}

resource "aws_lambda_permission" "allow_apigw_invoke_concerns_options" {
  statement_id  = "AllowAPIGatewayInvoke_GetAllConcerns_OPTIONS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.concerns.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${data.aws_api_gateway_rest_api.existing.execution_arn}/*/OPTIONS/concerns"
}

#—— DEPLOYMENT & STAGE ————————————————————————————————————

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = data.aws_api_gateway_rest_api.existing.id

  depends_on = [
    aws_api_gateway_integration.get_concerns,
    aws_api_gateway_integration.options_concerns,
    aws_lambda_permission.allow_apigw_invoke_concerns_get,
    aws_lambda_permission.allow_apigw_invoke_concerns_options,
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.get_concerns,
      aws_api_gateway_integration.options_concerns
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "stage" {
  rest_api_id   = data.aws_api_gateway_rest_api.existing.id
  deployment_id = aws_api_gateway_deployment.deployment.id
  stage_name    = var.stage_name
}
