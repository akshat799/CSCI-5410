import boto3
import json
import uuid
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
        bike_id = body.get('bike_id')
        slot_id = body.get('slot_id')
        user_id = body.get('user_id')  # Use email from request body

        # Validate input
        if not all([bike_id, slot_id, user_id]):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Missing required fields: bike_id, slot_id, user_id'})
            }

        # Verify slot exists
        slot_response = availability_table.get_item(Key={'bike_id': bike_id, 'slot_id': slot_id})
        if 'Item' not in slot_response:
            return {
                'statusCode': 404,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Slot not found'})
            }
        slot = slot_response['Item']

        # Create booking
        booking_reference = f"BOOK{uuid.uuid4().hex[:8].upper()}"
        booking = {
            'booking_reference': booking_reference,
            'user_id': user_id,  # Store email
            'email': user_id,  # Store email for compatibility
            'bike_id': bike_id,
            'slot_id': slot_id,
            'startTime': slot['startTime'],
            'endTime': slot['endTime'],
            'status': 'booked',
            'created_at': datetime.utcnow().isoformat()
        }
        bookings_table.put_item(Item=booking)

        # Remove slot from availability
        availability_table.delete_item(Key={'bike_id': bike_id, 'slot_id': slot_id})

        return {
            'statusCode': 201,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Slot booked successfully',
                'booking_reference': booking_reference
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