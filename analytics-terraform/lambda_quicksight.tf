# Generate zip for quicksight aggregator lambda
data "archive_file" "quicksight_zip" {
  type        = "zip"
  source_file = "${path.module}/../analytics-lambda/quicksight_aggregator.py"
  output_path = "${path.module}/quicksight_aggregator.zip"
}

resource "aws_lambda_function" "quicksight_aggregator" {
  filename         = data.archive_file.quicksight_zip.output_path
  function_name    = "quicksight_data_aggregator"
  role            = aws_iam_role.lambda_role.arn
  handler         = "quicksight_aggregator.lambda_handler"
  runtime         = "python3.9"
  source_code_hash = data.archive_file.quicksight_zip.output_base64sha256

  timeout     = 30
  memory_size = 512

  environment {
    variables = {
      S3_BUCKET_NAME      = aws_s3_bucket.analytics_data.id
      USERS_TABLE_NAME    = "Users"
      FEEDBACK_TABLE_NAME = "CustomerFeedback"
      BIKES_TABLE_NAME    = "Bikes"
    }
  }

  depends_on = [data.archive_file.quicksight_zip]
}
