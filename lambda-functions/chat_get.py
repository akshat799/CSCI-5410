import json
import os

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['CHATLOGS_TABLE']
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    try:
        concern_id = event['pathParameters']['concernId']

        resp = table.query(
            KeyConditionExpression=Key('concernId').eq(concern_id),
            ScanIndexForward=True  # ascending by sort key (timestamp)
        )

        chats = resp.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'chats': chats})
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
