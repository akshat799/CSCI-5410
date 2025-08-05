import json
import os
import uuid
from datetime import datetime
import boto3

dynamodb   = boto3.resource('dynamodb')
TABLE_NAME = os.environ['CHATLOGS_TABLE']
table      = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        concern_id = event['pathParameters']['concernId']
        body       = json.loads(event.get('body') or '{}')

        sender            = body.get('from')
        recipient         = body.get('to')
        message           = body.get('message')
        booking_reference = body.get('bookingReference')

        # require bookingReference as well
        if not all([sender, recipient, message, booking_reference]):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: from, to, message, bookingReference'
                })
            }

        timestamp = datetime.utcnow().isoformat()
        chat_id   = str(uuid.uuid4())

        # include bookingReference in the item
        item = {
            'chatId':           chat_id,
            'concernId':        concern_id,
            'timestamp':        timestamp,
            'from':             sender,
            'to':               recipient,
            'messageText':      message,
            'bookingReference': booking_reference
        }

        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps(item)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
