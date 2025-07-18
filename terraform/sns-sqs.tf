variable "notification_queue_name" {
  description = "Name of the SQS queue for user notifications"
  type        = string
  default     = "user-notifications-queue"
}

resource "aws_sqs_queue" "notification_queue" {
  name                         = var.notification_queue_name
  visibility_timeout_seconds   = 30
  message_retention_seconds    = 1209600
}

resource "aws_sns_topic" "registration_topic" {
  name = "user-registration-topic"
}

resource "aws_sns_topic" "login_topic" {
  name = "user-login-topic"
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

resource "aws_ses_email_identity" "from_address" {
  email = "csci5408@gmail.com"
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
