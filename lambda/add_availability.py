import boto3
import json
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bikes_table = dynamodb.Table('Bikes')

def lambda_handler(event, context):
    try:
        # Extract user info from Cognito JWT token
        claims = event['requestContext']['authorizer']['claims']
        user_groups = claims.get('cognito:groups', [])
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []

        if 'FranchiseOperator' not in user_groups:
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied. Franchise operators only.'})
            }

        body = json.loads(event.get('body', '{}'))
        bike_id = body.get('bike_id')
        slots = body.get('slots', [])  # List of {startTime, endTime}

        # Validate bike_id exists in Bikes table
        bike_response = bikes_table.get_item(Key={'bike_id': bike_id})
        if 'Item' not in bike_response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Bike not found'})
            }

        # Add each slot to Availability table
        for slot in slots:
            slot_id = str(uuid.uuid4())
            availability_table.put_item(
                Item={
                    'bike_id': bike_id,
                    'slot_id': slot_id,
                    'startTime': slot['startTime'],
                    'endTime': slot['endTime'],
                    'created_at': datetime.utcnow().isoformat()
                }
            )

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Availability slots added successfully'})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error: {str(e)}'})
        }