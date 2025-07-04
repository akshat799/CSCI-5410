import json

def lambda_handler(event, context):
    # Lex V1 event sample structure
    return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText",
                "content": "To register, simply go to our website, click on Sign Up, fill in your details and follow the verification steps."
            }
        }
    }
