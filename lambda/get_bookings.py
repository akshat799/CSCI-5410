import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')
bikes_table = dynamodb.Table('Bikes')

def lambda_handler(event, context):
    try:
        # Extract user info from Cognito JWT token
        claims = event['requestContext']['authorizer']['claims']
        user_groups = claims.get('cognito:groups', [])
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []
        user_id = claims.get('email')

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

        bookings = []

        if 'RegisteredCustomer' in user_groups and 'FranchiseOperator' not in user_groups:
            # Fetch only user's bookings
            response = bookings_table.query(
                IndexName='UserIdIndex',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            bookings = response['Items']
        elif 'FranchiseOperator' in user_groups:
            # Fetch all bookings or filtered by query params
            query_params = event.get('queryStringParameters', {}) or {}
            bike_id = query_params.get('bike_id')
            start_time = query_params.get('startTime')
            status = query_params.get('status')

            filter_expression = []
            expression_values = {}
            expression_names = {}

            if bike_id:
                filter_expression.append('#b = :bike_id')
                expression_values[':bike_id'] = bike_id
                expression_names['#b'] = 'bike_id'
            if start_time:
                filter_expression.append('startTime = :start_time')
                expression_values[':start_time'] = start_time
            if status:
                filter_expression.append('#s = :status')
                expression_values[':status'] = status
                expression_names['#s'] = 'status'

            scan_kwargs = {}
            if filter_expression:
                scan_kwargs['FilterExpression'] = ' AND '.join(filter_expression)
                scan_kwargs['ExpressionAttributeValues'] = expression_values
                if expression_names:
                    scan_kwargs['ExpressionAttributeNames'] = expression_names

            response = bookings_table.scan(**scan_kwargs)
            bookings = response['Items']

            # Handle pagination if needed
            while 'LastEvaluatedKey' in response:
                scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
                response = bookings_table.scan(**scan_kwargs)
                bookings.extend(response['Items'])

        # Fetch bike type for each booking
        for booking in bookings:
            bike_id = booking.get('bike_id')
            if bike_id:
                bike_response = bikes_table.get_item(
                    Key={'bike_id': bike_id},
                    ProjectionExpression='#t',
                    ExpressionAttributeNames={'#t': 'bike_type'}
                )
                bike = bike_response.get('Item')
                booking['bike_type'] = bike.get('bike_type', 'Unknown') if bike else 'Unknown'

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'bookings': bookings,
                'count': len(bookings)
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