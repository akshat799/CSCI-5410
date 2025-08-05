# S3 bucket for analytics data
resource "aws_s3_bucket" "analytics_data" {
  bucket = "dalscooter-analytics-data-${random_string.bucket_suffix.result}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_versioning" "analytics_versioning" {
  bucket = aws_s3_bucket.analytics_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

# EventBridge rule to run daily
resource "aws_cloudwatch_event_rule" "daily_aggregation" {
  name                = "daily-analytics-aggregation"
  description         = "Trigger analytics aggregation daily"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_aggregation.name
  target_id = "QuickSightAggregatorTarget"
  arn       = aws_lambda_function.quicksight_aggregator.arn
}

# Lambda permission for EventBridge to invoke the function
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.quicksight_aggregator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_aggregation.arn
}

# IAM policy for S3 access
resource "aws_iam_role_policy" "lambda_s3_policy" {
  name = "lambda-s3-analytics-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.analytics_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.analytics_data.arn
      }
    ]
  })
}


# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "lambda-analytics-role"

  # Trust policy to allow Lambda to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Attach AWSLambdaBasicExecutionRole policy for CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM policy for DynamoDB access
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "lambda-dynamodb-analytics-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/Users",
          "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/CustomerFeedback",
          "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/Bikes"
        ]
      }
    ]
  })
}

data "aws_caller_identity" "current" {}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1" # Adjust to your region
}