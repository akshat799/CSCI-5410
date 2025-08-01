import json
import boto3
import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
logins_table = dynamodb.Table('Logins')

def lambda_handler(event, context):
    try:
        # Extract user_id from Cognito authorizer claims
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        user_id = claims.get('cognito:username')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({'error': 'Missing user_id in request'})
            }

        # Query the Logins table for the most recent login record
        response = logins_table.query(
            IndexName='UserIdIndex',
            KeyConditionExpression=Key('user_id').eq(user_id),
            ScanIndexForward=False,  # Sort in descending order to get the latest record
            Limit=1
        )

        items = response.get('Items', [])
        if not items:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({'error': 'No login record found for user'})
            }

        login_id = items[0]['login_id']

        # Update the login record with logout_timestamp
        logins_table.update_item(
            Key={
                'login_id': login_id,
                'login_timestamp': items[0]['login_timestamp']
            },
            UpdateExpression='SET logout_timestamp = :logout_time',
            ExpressionAttributeValues={
                ':logout_time': datetime.datetime.utcnow().isoformat()
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
            'body': json.dumps({'error': f'Error recording logout: {str(e)}'})
        }