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

        # Query using the ConcernIndex GSI
        resp = table.query(
            IndexName='ConcernIndex',
            KeyConditionExpression=Key('concernId').eq(concern_id),
            ScanIndexForward=True  # ascending by sort key (timestamp)
        )

        chats = resp.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({'chats': chats})
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