import boto3
import json
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

        if 'FranchiseOperator' not in user_groups and 'RegisteredCustomer' not in user_groups:
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied. Franchise operators or registered customers only.'})
            }

        query_params = event.get('queryStringParameters', {}) or {}
        bike_id = query_params.get('bike_id')
        bike_type = query_params.get('type')

        # Query availability
        if bike_id:
            response = availability_table.query(
                KeyConditionExpression='bike_id = :bike_id',
                ExpressionAttributeValues={':bike_id': bike_id}
            )
            slots = response['Items']
        else:
            response = availability_table.scan()
            slots = response['Items']

        # Join with bike information
        results = []
        for slot in slots:
            bike_response = bikes_table.get_item(Key={'bike_id': slot['bike_id']})
            if 'Item' in bike_response:
                bike = bike_response['Item']
                if not bike_type or bike['type'] == bike_type:
                    results.append({
                        'bike_id': slot['bike_id'],
                        'slot_id': slot['slot_id'],
                        'startTime': slot['startTime'],
                        'endTime': slot['endTime'],
                        'bike_type': bike['type'],
                        'hourly_rate': float(bike['hourly_rate']),
                        'features': bike.get('features', {})
                    })

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'slots': json.loads(json.dumps(results, default=decimal_default)),
                'count': len(results)
            })
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

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError