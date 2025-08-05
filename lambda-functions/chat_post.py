import json
import os
import uuid
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['CHATLOGS_TABLE']
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        concern_id = event['pathParameters']['concernId']
        body = json.loads(event.get('body') or '{}')

        sender   = body.get('from')
        recipient= body.get('to')
        message  = body.get('message')

        if not all([sender, recipient, message]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields: from, to, message'})
            }

        timestamp = datetime.utcnow().isoformat()
        message_id = str(uuid.uuid4())

        item = {
            'concernId': concern_id,
            'timestamp': timestamp,
            'messageId': message_id,
            'from': sender,
            'to': recipient,
            'message': message
        }

        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(item)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
