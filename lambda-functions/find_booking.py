import json
import boto3

dynamodb = boto3.client('dynamodb')
BOOKINGS_TABLE = "Bookings"  # or use os.environ if you pass it via Terraform env

def lambda_handler(event, context):
    # Get slot value from Lex input
    booking_reference = event['currentIntent']['slots']['bookingReference']
    
    # Query DynamoDB
    response = dynamodb.get_item(
        TableName=BOOKINGS_TABLE,
        Key={'bookingReference': {'S': booking_reference}}
    )
    
    if 'Item' not in response:
        message = f"Sorry, I couldn't find a booking with reference {booking_reference}."
    else:
        access_code = response['Item']['accessCode']['S']
        duration = response['Item']['duration']['N']
        message = f"Your booking {booking_reference} has access code {access_code} and is valid for {duration} hours."

    return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText",
                "content": message
            }
        }
    }
