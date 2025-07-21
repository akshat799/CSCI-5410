import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table('Bikes')

def lambda_handler(event, context):
    try:
        # This endpoint is public - no authentication required
        print(f"Public bikes request: {json.dumps(event)}")
        
        http_method = event['httpMethod']
        query_params = event.get('queryStringParameters') or {}
        
        if http_method == 'GET':
            return get_public_bikes(query_params)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Method not allowed'})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error: {str(e)}'})
        }

def get_public_bikes(query_params):
    try:
        bike_type = query_params.get('type')
        status = query_params.get('status', 'available') 
        location = query_params.get('location')
        
        # Filter bikes based on query parameters
        if bike_type:
            response = bikes_table.query(
                IndexName='TypeIndex',
                KeyConditionExpression='#bike_type = :type',
                FilterExpression='#status = :status',
                ExpressionAttributeNames={
                    '#bike_type': 'type',
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':type': bike_type,
                    ':status': status
                }
            )
        elif status:
            response = bikes_table.query(
                IndexName='StatusIndex',
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': status}
            )
        else:
            # Get all bikes (for admin or debugging)
            response = bikes_table.scan()
        
        bikes = response['Items']
        
        # Additional filtering for location if specified
        if location:
            bikes = [bike for bike in bikes if location.lower() in bike.get('location', '').lower()]
        
        # Convert Decimal values to float for JSON serialization
        bikes = json.loads(json.dumps(bikes, default=decimal_default))
        
        # Sort bikes by created_at (newest first)
        bikes.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'bikes': bikes,
                'count': len(bikes),
                'filters_applied': {
                    'type': bike_type,
                    'status': status,
                    'location': location
                }
            })
        }
        
    except Exception as e:
        print(f"Error in get_public_bikes: {str(e)}")
        raise e

def decimal_default(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError