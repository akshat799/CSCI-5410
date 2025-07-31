import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bookings_table = dynamodb.Table('Bookings')

def lambda_handler(event, context):
    try:
        # Extract user info from Cognito JWT token
        claims = event['requestContext']['authorizer']['claims']
        user_groups = claims.get('cognito:groups', [])
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []
        user_id = claims.get('sub')

        if 'RegisteredCustomer' not in user_groups:
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied. Registered customers only.'})
            }

        body = json.loads(event.get('body', '{}'))
        booking_reference = body.get('booking_reference')

        # Verify booking exists and belongs to user
        booking_response = bookings_table.get_item(Key={'booking_reference': booking_reference})
        if 'Item' not in booking_response or booking_response['Item']['user_id'] != user_id:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Booking not found or unauthorized'})
            }
        booking = booking_response['Item']

        # Update booking status to cancelled
        bookings_table.update_item(
            Key={'booking_reference': booking_reference},
            UpdateExpression='SET #status = :status, updated_at = :updated_at',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'cancelled',
                ':updated_at': datetime.utcnow().isoformat()
            }
        )

        # Re-add slot to availability
        availability_table.put_item(
            Item={
                'bike_id': booking['bike_id'],
                'slot_id': booking['slot_id'],
                'startTime': booking['startTime'],
                'endTime': booking['endTime'],
                'created_at': datetime.utcnow().isoformat()
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': 'Booking cancelled successfully'})
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