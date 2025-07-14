import json
import boto3
import uuid

dynamodb = boto3.client('dynamodb')
CONCERNS_TABLE = "Concerns"  # or use os.environ

def lambda_handler(event, context):
    booking_reference = event['currentIntent']['slots']['bookingReference']
    concern_id = str(uuid.uuid4())
    
    # Store concern
    dynamodb.put_item(
        TableName=CONCERNS_TABLE,
        Item={
            'concernId': {'S': concern_id},
            'bookingReference': {'S': booking_reference}
        }
    )

    return {
        "dialogAction": {
            "type": "Close",
            "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText",
                "content": f"Your concern for booking {booking_reference} has been recorded. Support will reach out shortly."
            }
        }
    }