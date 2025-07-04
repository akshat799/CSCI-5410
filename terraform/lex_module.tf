###############################
# main.tf
###############################

#--------------------------------
# 1. Provider & Variables
#--------------------------------

#--------------------------------
# 2. DynamoDB Tables
#--------------------------------

# Booking lookup table
resource "aws_dynamodb_table" "bookings" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "bookingReference"

  attribute {
    name = "bookingReference"
    type = "S"
  }

  attribute {
    name = "accessCode"
    type = "S"
  }

  attribute {
    name = "duration"
    type = "N"
  }
}

# Concerns table
resource "aws_dynamodb_table" "concerns" {
  name           = "Concerns"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "concernId"

  attribute {
    name = "concernId"
    type = "S"
  }

  attribute {
    name = "bookingReference"
    type = "S"
  }
}

#--------------------------------
# 3. IAM Role for Lambdas
#--------------------------------
resource "aws_iam_role" "lambda_exec" {
  name               = "lambda_exec_role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Attach DynamoDB read/write and CloudWatch Logs
resource "aws_iam_role_policy" "lambda_policy" {
  name   = "lambda_dynamodb_policy"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.bookings.arn,
      aws_dynamodb_table.concerns.arn
    ]
  }
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

#--------------------------------
# 4. Lambda Functions
#--------------------------------
# 4.1 RegisterHelp (static responses)
resource "aws_lambda_function" "register_help" {
  filename         = "./dist/register_help.zip"  # prepared zip
  function_name    = "RegisterHelpLambda"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = filebase64sha256("./dist/register_help.zip")
}

# 4.2 FindBooking
resource "aws_lambda_function" "find_booking" {
  filename         = "./dist/find_booking.zip"
  function_name    = "FindBookingLambda"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = filebase64sha256("./dist/find_booking.zip")
  environment {
    variables = {
      BOOKINGS_TABLE = aws_dynamodb_table.bookings.name
    }
  }
}

# 4.3 SubmitConcern
resource "aws_lambda_function" "submit_concern" {
  filename         = "./dist/submit_concern.zip"
  function_name    = "SubmitConcernLambda"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = aws_iam_role.lambda_exec.arn
  source_code_hash = filebase64sha256("./dist/submit_concern.zip")
  environment {
    variables = {
      CONCERNS_TABLE = aws_dynamodb_table.concerns.name
    }
  }
}

# Allow Lex to invoke Lambdas
resource "aws_lambda_permission" "lex_invoke_register" {
  statement_id  = "AllowLexInvokeRegister"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register_help.function_name
  principal     = "lex.amazonaws.com"
}
resource "aws_lambda_permission" "lex_invoke_find" {
  statement_id  = "AllowLexInvokeFind"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.find_booking.function_name
  principal     = "lex.amazonaws.com"
}
resource "aws_lambda_permission" "lex_invoke_concern" {
  statement_id  = "AllowLexInvokeConcern"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_concern.function_name
  principal     = "lex.amazonaws.com"
}

#--------------------------------
# 5. Lex Bot & Intents
#--------------------------------
# 5.1 Slot Type for bookingReference
resource "aws_lex_slot_type" "booking_ref_type" {
  name        = "BookingReferenceType"
  enumeration_value {
    value = ""  # optional static enumerations
  }
  value_selection_strategy = "ORIGINAL_VALUE"
}

# 5.2 Intent: RegisterHelp
resource "aws_lex_intent" "register_help_intent" {
  name                = "RegisterHelpIntent"
  sample_utterances   = [
    "How do I register?",
    "What is the signup process?",
    "Help me sign up"
  ]
  fulfillment_activity {
    type = "CodeHook"
    code_hook {
      uri = aws_lambda_function.register_help.invoke_arn
      message_version = "1.0"
    }
  }
  conclusion_statement { messages { content = "Thanks for asking!" content_type = "PlainText" } }
}

# 5.3 Intent: FindBooking
resource "aws_lex_intent" "find_booking_intent" {
  name              = "FindBookingIntent"
  sample_utterances = [
    "What is my booking code for {bookingReference}",
    "Give me access code for booking {bookingReference}",
    "My booking reference is {bookingReference}"
  ]
  slots {
    name = "bookingReference"
    slot_type = aws_lex_slot_type.booking_ref_type.name
    slot_constraint = "Required"
    value_elicitation_prompt {
      max_attempts = 2
      messages { content = "Please tell me your booking reference code." content_type = "PlainText" }
    }
  }
  fulfillment_activity {
    type = "CodeHook"
    code_hook {
      uri = aws_lambda_function.find_booking.invoke_arn
n      message_version = "1.0"
    }
  }
  conclusion_statement { messages { content = "Hope that helps!" content_type = "PlainText" } }
}

# 5.4 Intent: SubmitConcern
resource "aws_lex_intent" "submit_concern_intent" {
  name              = "SubmitConcernIntent"
  sample_utterances = [
    "I have an issue with booking {bookingReference}",
    "There is a problem with my booking {bookingReference}",
    "Send concern for booking {bookingReference}"
  ]
  slots {
    name = "bookingReference"
    slot_type = aws_lex_slot_type.booking_ref_type.name
    slot_constraint = "Required"
    value_elicitation_prompt {
      max_attempts = 2
      messages { content = "What's your booking reference?" content_type = "PlainText" }
    }
  }
  fulfillment_activity {
    type = "CodeHook"
    code_hook {
      uri = aws_lambda_function.submit_concern.invoke_arn
      message_version = "1.0"
    }
  }
  conclusion_statement { messages { content = "Your concern has been submitted to our support team." content_type = "PlainText" } }
}

# 5.5 Lex Bot
resource "aws_lex_bot" "dalscooter_bot" {
  name                 = "DALScooterBot"
  locale               = "en_US"
  child_directed       = false
  process_behavior     = "BUILD"
  nlu_intent_confidence_threshold = 0.40
  intent {
    intent_name    = aws_lex_intent.register_help_intent.name
    intent_version = "$LATEST"
  }
  intent {
    intent_name    = aws_lex_intent.find_booking_intent.name
    intent_version = "$LATEST"
  }
  intent {
    intent_name    = aws_lex_intent.submit_concern_intent.name
    intent_version = "$LATEST"
  }
  clarification_prompt {
    max_attempts = 2
    messages { content = "Sorry, can you please rephrase?" content_type = "PlainText" }
  }
  abort_statement {
    messages { content = "I’m sorry, I couldn’t understand. Please try again later." content_type = "PlainText" }
  }
}

resource "aws_lex_bot_alias" "prod_alias" {
  name       = "Prod"
  bot_name   = aws_lex_bot.dalscooter_bot.name
  bot_version = "$LATEST"
}


