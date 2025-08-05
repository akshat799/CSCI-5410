variable "notification_queue_name" {
  description = "Name of the SQS queue for user notifications"
  type        = string
  default     = "user-notifications-queue"
}

variable "booking_failure_queue_name" {
  description = "Name of the SQS queue for booking failures"
  type        = string
  default     = "booking-failure-queue"
}

variable "booking_failure_topic_name" {
  description = "Name of the SNS topic for booking approval failures"
  type        = string
  default     = "booking-failure-topic"
}

variable "booking_confirmation_queue_name" {
  description = "Name of the SQS queue for booking confirmations"
  type        = string
  default     = "booking-confirmation-queue"
}

variable "booking_confirmation_topic_name" {
  description = "Name of the SNS topic for booking confirmations"
  type        = string
  default     = "booking-confirmation-topic"
}

variable "booking_request_queue_name" {
  description = "Name of the SQS queue for booking requests"
  type        = string
  default     = "booking-request-queue"
}

variable "booking_request_topic_name" {
  description = "Name of the SNS topic for booking requests"
  type        = string
  default     = "booking-request-topic"
}

resource "aws_sqs_queue" "notification_queue" {
  name                         = var.notification_queue_name
  visibility_timeout_seconds   = 30
  message_retention_seconds    = 1209600
}

resource "aws_sqs_queue" "booking_failure_queue" {
  name                         = var.booking_failure_queue_name
  visibility_timeout_seconds   = 30
  message_retention_seconds    = 1209600
}

resource "aws_sqs_queue" "booking_confirmation_queue" {
  name                         = var.booking_confirmation_queue_name
  visibility_timeout_seconds   = 30
  message_retention_seconds    = 1209600
}

resource "aws_sqs_queue" "booking_request_queue" {
  name                         = var.booking_request_queue_name
  visibility_timeout_seconds   = 30
  message_retention_seconds    = 1209600
}

resource "aws_sns_topic" "registration_topic" {
  name = "user-registration-topic"
}

resource "aws_sns_topic" "login_topic" {
  name = "user-login-topic"
}

resource "aws_sns_topic" "booking_failure_topic" {
  name = var.booking_failure_topic_name
}

resource "aws_sns_topic" "booking_confirmation_topic" {
  name = var.booking_confirmation_topic_name
}

resource "aws_sns_topic" "booking_request_topic" {
  name = var.booking_request_topic_name
}

variable "test_emails" {
  description = "List of email addresses to verify in SES sandbox"
  type        = list(string)
  default     = []
}

resource "aws_ses_email_identity" "test_recipients" {
  for_each = toset(var.test_emails)
  email    = each.key
}

resource "aws_ses_email_identity" "from_address" {
  email = "csci5408@gmail.com"
}

resource "aws_ses_template" "notification_template" {
  name    = "NotificationTemplate"
  subject = "{{subject}}"

  html = <<-EOF
    <html>
      <body style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
        <div style="max-width:600px; margin:0 auto; background-color:#ffffff; padding:20px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color:#333333; text-align:center;">DALScooter Notification</h2>
          <div style="color:#555555; font-size:16px; line-height:1.5;">
            {{message}}
          </div>
          <p style="margin-top:30px; color:#777777; font-size:14px;">
            Best regards,<br />
            DALScooter Team
          </p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:20px 0;" />
          <p style="text-align:center; color:#A0AEC0; font-size:12px; margin:0;">
            Your sustainable ride-sharing solution
          </p>
        </div>
      </body>
    </html>
  EOF

  text = <<-EOF
    {{message}}

    Regards,
    DALScooter Team
  EOF
}

resource "aws_sns_topic_subscription" "registration_to_queue" {
  topic_arn = aws_sns_topic.registration_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn
}

resource "aws_sns_topic_subscription" "login_to_queue" {
  topic_arn = aws_sns_topic.login_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.notification_queue.arn
}

resource "aws_sns_topic_subscription" "failure_to_queue" {
  topic_arn = aws_sns_topic.booking_failure_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.booking_failure_queue.arn
}

resource "aws_sns_topic_subscription" "confirmation_to_queue" {
  topic_arn = aws_sns_topic.booking_confirmation_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.booking_confirmation_queue.arn
}

resource "aws_sns_topic_subscription" "request_to_queue" {
  topic_arn = aws_sns_topic.booking_request_topic.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.booking_request_queue.arn
}

resource "aws_sqs_queue_policy" "notification_queue_policy" {
  queue_url = aws_sqs_queue.notification_queue.id
  policy    = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "sns.amazonaws.com" },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.notification_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn": [
              aws_sns_topic.registration_topic.arn,
              aws_sns_topic.login_topic.arn
            ]
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "booking_failure_queue_policy" {
  queue_url = aws_sqs_queue.booking_failure_queue.id
  policy    = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "sns.amazonaws.com" },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.booking_failure_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn": aws_sns_topic.booking_failure_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "booking_confirmation_queue_policy" {
  queue_url = aws_sqs_queue.booking_confirmation_queue.id
  policy    = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "sns.amazonaws.com" },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.booking_confirmation_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn": aws_sns_topic.booking_confirmation_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "booking_request_queue_policy" {
  queue_url = aws_sqs_queue.booking_request_queue.id
  policy    = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = { Service = "sns.amazonaws.com" },
        Action    = "sqs:SendMessage",
        Resource  = aws_sqs_queue.booking_request_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn": aws_sns_topic.booking_request_topic.arn
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_booking_request_publish" {
  name = "LambdaBookingRequestSNSPublish"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["sns:Publish"],
        Resource = [
          aws_sns_topic.booking_request_topic.arn,
          aws_sns_topic.booking_confirmation_topic.arn,
          aws_sns_topic.booking_failure_topic.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "post_confirmation_sns_publish" {
  name = "PostConfirmationSNSPublish"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "sns:Publish",
        Resource = aws_sns_topic.registration_topic.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "verify_auth_sns_publish" {
  name = "VerifyAuthSNSPublish"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "sns:Publish",
        Resource = aws_sns_topic.login_topic.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_ses_send" {
  name = "LambdaSESSend"
  role = aws_iam_role.lambda_role.name
  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail", "ses:SendBulkTemplatedEmail"],
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_booking_failure_handling" {
  name = "LambdaBookingFailureHandling"
  role = aws_iam_role.lambda_role.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "sns:Publish",
          "sqs:SendMessage"
        ],
        Resource = [
          aws_sns_topic.booking_failure_topic.arn,
          aws_sqs_queue.booking_failure_queue.arn
        ]
      }
    ]
  })
}

resource "aws_lambda_event_source_mapping" "send_failure_emails" {
  event_source_arn = aws_sqs_queue.booking_failure_queue.arn
  function_name    = aws_lambda_function.lambda["notification_consumer"].arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "send_confirmation_emails" {
  event_source_arn = aws_sqs_queue.booking_confirmation_queue.arn
  function_name    = aws_lambda_function.lambda["notification_consumer"].arn
  batch_size       = 1
  enabled          = true
}

resource "aws_lambda_event_source_mapping" "process_booking_requests" {
  event_source_arn = aws_sqs_queue.booking_request_queue.arn
  function_name    = aws_lambda_function.lambda["booking_approval"].arn
  batch_size       = 1
  enabled          = true
}

variable "concern_topic_name" {
  description = "Name of the SNS topic for customer concerns"
  type        = string
  default     = "concern-topic"
}

resource "aws_sns_topic" "concern_topic" {
  name = var.concern_topic_name
}

resource "aws_lambda_permission" "allow_sns_invoke_concern_processor" {
  statement_id  = "AllowSNSInvokeConcernProcessor"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["concern_processor"].function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.concern_topic.arn
}

resource "aws_sns_topic_subscription" "concern_to_processor" {
  topic_arn = aws_sns_topic.concern_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.lambda["concern_processor"].arn
}

resource "aws_iam_role_policy" "lambda_concern_publish" {
  name = "LambdaConcernSNSPublish"
  role = aws_iam_role.lambda_role.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowPublishToConcernTopic",
        Effect = "Allow",
        Action = ["sns:Publish"],
        Resource = aws_sns_topic.concern_topic.arn
      }
    ]
  })
}