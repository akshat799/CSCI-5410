import boto3
import json
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bikes_table = dynamodb.Table('Bikes')

def lambda_handler(event, context):
    try:
        # Debug: Print the full event to understand what we're receiving
        print(f"Full event: {json.dumps(event)}")
        
        # Extract user info from Cognito JWT token
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        
        print(f"Request context: {json.dumps(request_context)}")
        print(f"Authorizer: {json.dumps(authorizer)}")
        print(f"Claims: {json.dumps(claims)}")
        
        # Get groups - could be string or list
        user_groups = claims.get('cognito:groups', '')
        
        # Convert to list if it's a string
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []
        
        print(f"User groups: {user_groups}")
        
        # TEMPORARY: For debugging, bypass auth check if no authorizer data
        if not claims:
            print("No claims found - API Gateway authorizer not configured properly")
            print("Proceeding without auth check for debugging...")
        else:
            # Check if user is a franchise operator
            if 'FranchiseOperator' not in user_groups:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'message': 'Access denied. Franchise operators only.',
                        'debug': {
                            'user_groups': user_groups,
                            'claims': claims,
                            'has_authorizer': bool(authorizer)
                        }
                    })
                }

        http_method = event['httpMethod']
        path_parameters = event.get('pathParameters') or {}
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}

        if http_method == 'POST':
            return create_bike(body)
        elif http_method == 'PUT' and path_parameters.get('bike_id'):
            return update_bike(path_parameters['bike_id'], body)
        elif http_method == 'GET':
            return get_bikes(event.get('queryStringParameters') or {})
        elif http_method == 'DELETE' and path_parameters.get('bike_id'):
            return delete_bike(path_parameters['bike_id'])
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Invalid request'})
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

def create_bike(bike_data):
    bike_id = str(uuid.uuid4())
    
    bike_item = {
        'bike_id': bike_id,
        'type': bike_data.get('type', 'eBike'),  # eBike, Gyroscooter, Segway
        'access_code': bike_data.get('access_code', generate_access_code()),
        'hourly_rate': Decimal(str(bike_data.get('hourly_rate', 10.0))),  # Convert to Decimal
        'features': bike_data.get('features', {}),  # height_adjustment, battery_life, etc.
        'discount_code': bike_data.get('discount_code', ''),
        'status': 'available',  # available, booked, maintenance
        'location': bike_data.get('location', ''),
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    bikes_table.put_item(Item=bike_item)
    
    # Convert Decimal back to float for JSON response
    response_bike = json.loads(json.dumps(bike_item, default=decimal_default))
    
    return {
        'statusCode': 201,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Bike created successfully',
            'bike_id': bike_id,
            'bike': response_bike
        })
    }

def update_bike(bike_id, update_data):
    # Build update expression dynamically
    update_expression = "SET updated_at = :updated_at"
    expression_values = {':updated_at': datetime.utcnow().isoformat()}
    
    allowed_fields = ['type', 'access_code', 'hourly_rate', 'features', 'discount_code', 'status', 'location']
    
    for field in allowed_fields:
        if field in update_data:
            if field == 'hourly_rate':
                # Convert hourly_rate to Decimal
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = Decimal(str(update_data[field]))
            else:
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = update_data[field]
    
    bikes_table.update_item(
        Key={'bike_id': bike_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_values
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'message': 'Bike updated successfully'})
    }

def get_bikes(query_params):
    bike_type = query_params.get('type')
    status = query_params.get('status')
    
    if bike_type:
        response = bikes_table.query(
            IndexName='TypeIndex',
            KeyConditionExpression='#type = :type',
            ExpressionAttributeNames={'#type': 'type'},
            ExpressionAttributeValues={':type': bike_type}
        )
    elif status:
        response = bikes_table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status}
        )
    else:
        response = bikes_table.scan()
    
    # Convert Decimal values to float for JSON serialization
    bikes = json.loads(json.dumps(response['Items'], default=decimal_default))
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'bikes': bikes,
            'count': len(bikes)
        })
    }

def delete_bike(bike_id):
    bikes_table.delete_item(Key={'bike_id': bike_id})
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'message': 'Bike deleted successfully'})
    }

def generate_access_code():
    return f"DAL{uuid.uuid4().hex[:6].upper()}"

def decimal_default(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError