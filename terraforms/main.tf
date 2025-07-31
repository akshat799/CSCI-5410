provider "aws" {
  region  = "us-east-1"
  profile = "amplify-user-dalscooter"
}

data "aws_caller_identity" "current" {}

data "aws_cognito_user_pool" "main" {
  user_pool_id = "us-east-1_YN7a2ntIh"
}