#################################
# MODULE 2 - Virtual Assistant
# Fully updated: Python Lambdas + DynamoDB + Lex
#################################

# -------------------------------
# Lambda permissions for Lex
# -------------------------------
resource "aws_lambda_permission" "lex_invoke" {
  for_each      = aws_lambda_function.lex_lambda
  statement_id  = "AllowLexInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.arn
  principal     = "lex.amazonaws.com"
}


# -------------------------------
#  Lex Bot & Intents
# -------------------------------
resource "aws_lex_slot_type" "booking_ref_type" {
  name                     = "BookingReferenceType"
  value_selection_strategy = "ORIGINAL_VALUE"

  enumeration_value {
    value = "dummyBooking"
  }
}


resource "aws_lex_intent" "register_help_intent" {
  name              = "RegisterHelpIntent"
  sample_utterances = ["How do I register?", "What is the signup process?", "Help me sign up"]

    fulfillment_activity {
    type = "CodeHook"
    code_hook {
        uri = aws_lambda_function.lex_lambda["register_help"].arn

        message_version = "1.0"
    }
    }
  conclusion_statement {
    message {
      content      = "Thanks for asking!"
      content_type = "PlainText"
    }
  }
}

resource "aws_lex_intent" "find_booking_intent" {
  name              = "FindBookingIntent"
  sample_utterances = [
    "What is my booking code for {bookingReference}",
    "Give me access code for booking {bookingReference}",
    "My booking reference is {bookingReference}"
  ]

  slot {
    name                 = "bookingReference"
    slot_type             = aws_lex_slot_type.booking_ref_type.name
    slot_constraint       = "Required"

    value_elicitation_prompt {
      max_attempts = 2
      message {
        content      = "Please tell me your booking reference code."
        content_type = "PlainText"
      }
    }
  }

  fulfillment_activity {
    type = "CodeHook"
    code_hook {
    uri = aws_lambda_function.lex_lambda["find_booking"].arn

    message_version = "1.0"
    }
  }

  conclusion_statement {
    message {
      content      = "Hope that helps!"
      content_type = "PlainText"
    }
  }
}


resource "aws_lex_intent" "submit_concern_intent" {
  name              = "SubmitConcernIntent"
  sample_utterances = [
    "I have an issue with booking {bookingReference}",
    "There is a problem with my booking {bookingReference}",
    "Send concern for booking {bookingReference}"
  ]

  slot {
    name                 = "bookingReference"
    slot_type             = aws_lex_slot_type.booking_ref_type.name
    slot_constraint       = "Required"

    value_elicitation_prompt {
      max_attempts = 2
      message {
        content      = "What's your booking reference?"
        content_type = "PlainText"
      }
    }
  }

  fulfillment_activity {
    type = "CodeHook"
    code_hook {
    uri = aws_lambda_function.lex_lambda["submit_concern"].arn
    message_version = "1.0"
    }
  }

  conclusion_statement {
    message {
      content      = "Your concern has been submitted to our support team."
      content_type = "PlainText"
    }
  }
}


resource "aws_lex_bot" "dalscooter_bot" {
  name                                 = "DALScooterBot"
  locale                               = "en-US"
  child_directed                       = false
  process_behavior                     = "BUILD"
  nlu_intent_confidence_threshold      = 0.40

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
    message {
      content      = "Sorry, can you please rephrase?"
      content_type = "PlainText"
    }
  }

  abort_statement {
    message {
      content      = "I’m sorry, I couldn’t understand. Please try again later."
      content_type = "PlainText"
    }
  }
}


resource "aws_lex_bot_alias" "prod_alias" {
  name        = "Prod"
  bot_name    = aws_lex_bot.dalscooter_bot.name
  bot_version = "$LATEST"
}
