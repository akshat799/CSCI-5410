provider "aws" {
  region  = "us-east-1"
  profile = "amplify-user-dalscooter"
}

data "terraform_remote_state" "lambda" {
  backend = "local"
  config = {
    path = "../terraform/terraform.tfstate"
  }
}

data "terraform_remote_state" "core" {
  backend = "local"
  config = {
    path = "../terraform/terraform.tfstate"
  }
}