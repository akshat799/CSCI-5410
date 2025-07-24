import boto3
import json

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bikes_table = dynamodb.Table('Bikes')

def get_user_groups(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    groups = claims.get('cognito:groups', '')
    return [groups] if isinstance(groups, str) and groups else groups

def lambda_handler(event, context):
    allowed_groups = ['FranchiseOperator']
    user_groups = get_user_groups(event)

    if not any(group in allowed_groups for group in user_groups):
        return {
            "statusCode": 403,
            'headers': cors_headers(),
            "body": json.dumps({"message": "Access Denied", "user_groups": user_groups})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        scooter_id = body.get('scooterId')
        date = body.get('date')
        slots = body.get('slots')

        if not scooter_id or not date or not isinstance(slots, list):
            return {
                "statusCode": 400,
                'headers': cors_headers(),
                "body": json.dumps({"error": "Missing required fields or invalid slots format"})
            }

        # 🔍 Lookup from Bikes table
        bike_response = bikes_table.get_item(Key={'bike_id': scooter_id})
        if 'Item' not in bike_response:
            return {
                "statusCode": 404,
                'headers': cors_headers(),
                "body": json.dumps({"error": f"No bike found with ID {scooter_id}"})
            }

        bike = bike_response['Item']
        scooter_type = bike.get('type', 'eBike')
        location = bike.get('location', 'Unknown')
        access_code = bike.get('access_code', '')

        availability_table.put_item(Item={
            'scooterId': scooter_id,
            'date': date,
            'scooterType': scooter_type,
            'location': location,
            'slots': slots,
            'access_code': access_code
        })

        return {
            "statusCode": 200,
            'headers': cors_headers(),
            "body": json.dumps({"message": "Availability slots added successfully"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            'headers': cors_headers(),
            "body": json.dumps({"error": str(e)})
        }

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
    }
