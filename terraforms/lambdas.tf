locals {
  lambdas = {
    add_availability      = "${path.module}/../lambda/add_availability.py"
    get_availability      = "${path.module}/../lambda/get_availability.py"
    book_slot             = "${path.module}/../lambda/book_slot.py"
    cancel_booking        = "${path.module}/../lambda/cancel_booking.py"
    get_bookings          = "${path.module}/../lambda/get_bookings.py"
    update_availability   = "${path.module}/../lambda/update_availability.py"
    get_embed_url         = "${path.module}/../lambda/get_embed_url.py"
    sync_quicksight_users = "${path.module}/../lambda/sync_quicksight_users.py"
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
  function_name    = replace(each.key, "_", "")
  filename         = each.value.output_path
  handler          = "${each.key}.lambda_handler"
  runtime          = "python3.9"
  role             = contains(["get_embed_url", "sync_quicksight_users"], each.key) ? aws_iam_role.lambda_quicksight_role.arn : aws_iam_role.lambda_role.arn
  source_code_hash = each.value.output_base64sha256
  timeout          = 30

  environment {
    variables = contains(["get_embed_url", "sync_quicksight_users"], each.key) ? {
      USER_POOL_ID   = data.aws_cognito_user_pool.main.id
      AWS_ACCOUNT_ID = data.aws_caller_identity.current.account_id
    } : {}
  }
}

resource "aws_cloudwatch_event_rule" "cognito_group_change" {
  name        = "CognitoGroupChange"
  description = "Capture Cognito group membership changes"

  event_pattern = jsonencode({
    source = ["aws.cognito-idp"],
    detail-type = ["AWS API Call via CloudTrail"],
    detail = {
      eventSource = ["cognito-idp.amazonaws.com"],
      eventName = ["AdminAddUserToGroup", "AdminRemoveUserFromGroup"]
    }
  })
}

resource "aws_cloudwatch_event_target" "sync_quicksight_users" {
  rule      = aws_cloudwatch_event_rule.cognito_group_change.name
  target_id = "SyncQuickSightUsers"
  arn       = aws_lambda_function.lambda["sync_quicksight_users"].arn
}

resource "aws_lambda_permission" "allow_cloudwatch_sync_quicksight" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda["sync_quicksight_users"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cognito_group_change.arn
}