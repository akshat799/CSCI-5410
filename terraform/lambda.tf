locals {
  lambdas = {
    define_auth       = "${path.module}/../lambda-functions/define_auth.py"
    create_auth       = "${path.module}/../lambda-functions/create_auth.py"
    verify_auth       = "${path.module}/../lambda-functions/verify_auth.py"
    post_confirmation = "${path.module}/../lambda-functions/post_confirmation.py"

    add_availability    = "${path.module}/../lambda-functions/add_availability.py"
    get_availability    = "${path.module}/../lambda-functions/get_availability.py"
    book_slot           = "${path.module}/../lambda-functions/book_slot.py"
    cancel_booking      = "${path.module}/../lambda-functions/cancel_booking.py"
    get_bookings        = "${path.module}/../lambda-functions/get_bookings.py"
    update_availability = "${path.module}/../lambda-functions/update_availability.py"
  }
}

data "archive_file" "lambda_zips" {
  for_each    = local.lambdas
  type        = "zip"
  for_each    = local.lambdas
  type        = "zip"
  source_file = each.value
  output_path = "${path.module}/${each.key}.zip"
}

resource "aws_lambda_function" "lambda" {
  for_each         = data.archive_file.lambda_zips
  function_name    = each.key == "notification_consumer" ? "notificationConsumer" : each.key
  filename         = each.value.output_path
  handler          = "${replace(each.key, "_check", "")}.lambda_handler"
  runtime          = "python3.9"
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = each.value.output_base64sha256

  environment {
    variables = each.key == "notification_consumer" ? {
      SES_FROM_ADDRESS = "csci5408@gmail.com"
      SES_TEMPLATE_NAME = "NotificationTemplate"
    } : {
      REGISTRATION_TOPIC_ARN = aws_sns_topic.registration_topic.arn
      LOGIN_TOPIC_ARN        = aws_sns_topic.login_topic.arn
    }
  }
}

resource "aws_iam_role_policy" "lambda_sqs_permissions" {
  name = "LambdaSQSPermissions"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ChangeMessageVisibility"
        ],
        Resource = aws_sqs_queue.notification_queue.arn
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "consumer_sqs" {
  event_source_arn = aws_sqs_queue.notification_queue.arn
  function_name    = aws_lambda_function.lambda["notification_consumer"].arn
  batch_size       = 1
  enabled          = true
}
