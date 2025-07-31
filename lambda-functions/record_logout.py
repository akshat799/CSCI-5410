import json
import boto3
import os
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['LOGINS_TABLE']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Extract user_id from Cognito authorizer claims
        claims = event['requestContext']['authorizer']['claims']
        user_id = claims['sub']
        
        # Generate unique login_id and timestamp
        login_id = str(uuid.uuid4())
        login_timestamp = datetime.utcnow().isoformat()
        
        # Record logout event
        table.put_item(
            Item={
                'login_id': login_id,
                'login_timestamp': login_timestamp,
                'user_id': user_id,
                'event_type': 'logout'
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({'message': 'Logout recorded successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            'body': json.dumps({'error': str(e)})
        }