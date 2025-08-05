locals {
  lambdas = {
    define_auth           = "${path.module}/../lambda-functions/define_auth.py"
    create_auth           = "${path.module}/../lambda-functions/create_auth.py"
    verify_auth           = "${path.module}/../lambda-functions/verify_auth.py"
    post_confirmation     = "${path.module}/../lambda-functions/post_confirmation.py"
    notification_consumer = "${path.module}/../lambda-functions/notification_consumer.py"
    bike_management       = "${path.module}/../lambda-functions/bike_management.py"  
    get_bikes_public      = "${path.module}/../lambda-functions/get_bikes_public.py"
    feedback_management   = "${path.module}/../lambda-functions/feedback_management.py"
    booking_request       = "${path.module}/../lambda-functions/eBikeBookingRequest.py"
    booking_approval      = "${path.module}/../lambda-functions/eBikeBookingApproval.py"
    concern_processor     = "${path.module}/../lambda-functions/concern_processor.py"
    chat_post             = "${path.module}/../lambda-functions/chat_post.py"
    chat_get             = "${path.module}/../lambda-functions/chat_get.py"
  }
}

data "archive_file" "lambda_zips" {
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
    variables = merge({
      SES_FROM_ADDRESS           = "csci5408@gmail.com",
      SES_TEMPLATE_NAME          = "NotificationTemplate",
      SES_ADMIN_EMAIL            = "csci5408@gmail.com",
      BOOKING_FAILURE_TOPIC_ARN = try(aws_sns_topic.booking_failure_topic.arn, ""),
      BOOKING_FAILURE_QUEUE_URL  = try(aws_sqs_queue.booking_failure_queue.url, ""),
      BOOKING_CONFIRMATION_TOPIC_ARN = try(aws_sns_topic.booking_confirmation_topic.arn, ""),
      BOOKING_CONFIRMATION_QUEUE_URL = try(aws_sqs_queue.booking_confirmation_queue.url, ""),
      BOOKING_REQUEST_TOPIC_ARN      = try(aws_sns_topic.booking_request_topic.arn, ""),
      BOOKING_REQUEST_QUEUE_URL      = try(aws_sqs_queue.booking_request_queue.url, ""),
      REGISTRATION_TOPIC_ARN     = try(aws_sns_topic.registration_topic.arn, ""),
      LOGIN_TOPIC_ARN            = try(aws_sns_topic.login_topic.arn, "")
    },
    each.key == "concern_processor" ? {
        USERS_TABLE    = aws_dynamodb_table.users.name
        CHATLOGS_TABLE = aws_dynamodb_table.chatlogs.name
    } : {}
    )
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
        Resource = [
          aws_sqs_queue.notification_queue.arn,
          aws_sqs_queue.booking_failure_queue.arn,
          aws_sqs_queue.booking_confirmation_queue.arn,
          aws_sqs_queue.booking_request_queue.arn
        ]
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

resource "aws_lambda_event_source_mapping" "booking_approval_sqs_trigger" {
  event_source_arn = aws_sqs_queue.booking_request_queue.arn
  function_name    = aws_lambda_function.lambda["booking_approval"].arn
  batch_size       = 1
  enabled          = true
}

