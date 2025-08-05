import boto3
import json
import uuid
from datetime import datetime
import os

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bookings_table = dynamodb.Table('Bookings')

sns = boto3.client('sns')

REQUEST_TOPIC_ARN = os.environ['BOOKING_REQUEST_TOPIC_ARN']
FAILURE_TOPIC_ARN = os.environ['BOOKING_FAILURE_TOPIC_ARN']

def lambda_handler(event, context):
    try:
        claims = event['requestContext']['authorizer']['claims']
        user_groups = claims.get('cognito:groups', [])
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []

        if 'RegisteredCustomer' not in user_groups:
            raise PermissionError("Access denied. Registered customers only.")

        body = json.loads(event.get('body', '{}'))
        bike_id = body.get('bike_id')
        slot_id = body.get('slot_id')
        user_id = body.get('user_id')

        if not all([bike_id, slot_id, user_id]):
            raise ValueError("Missing required fields: bike_id, slot_id, user_id")

        slot_response = availability_table.get_item(Key={'bike_id': bike_id, 'slot_id': slot_id})
        if 'Item' not in slot_response:
            raise LookupError(f"Slot {slot_id} for bike {bike_id} is no longer available")

        slot = slot_response['Item']

        booking_reference = f"BOOK{uuid.uuid4().hex[:8].upper()}"
        message = {
            'booking_reference': booking_reference,
            'user_id': user_id,
            'bike_id': bike_id,
            'slot_id': slot_id,
            'startTime': slot['startTime'],
            'endTime': slot['endTime'],
            'requested_at': datetime.utcnow().isoformat()
        }

        # 1. Save 'pending' booking
        bookings_table.put_item(Item={
            **message,
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        })

        # 2. Publish to approval topic (SNS)
        sns.publish(
            TopicArn=REQUEST_TOPIC_ARN,
            Subject='Booking Request',
            Message=json.dumps(message)
        )

        # 3. Return success
        return {
            'statusCode': 202,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Booking request received and is pending approval',
                'booking_reference': booking_reference,
                'status': 'pending'
            })
        }

    except Exception as e:
        error_message = str(e)
        failed_body = event.get('body', '{}')
        user_id = json.loads(failed_body).get('user_id', 'csci5408@gmail.com')

        payload = {
            'email': user_id,
            'subject': 'Booking Request Failed',
            'message': (
                f"Hi {user_id},\n\n"
                "Unfortunately, your booking request could not be processed due to the following error:\n\n"
                f"{error_message}\n\n"
                "Please double-check your booking details and try again.\n"
                "If the problem persists, contact our support team.\n\n"
                "– DALScooter Team"
            )
        }

        sns.publish(
            TopicArn=FAILURE_TOPIC_ARN,
            Subject='Booking Request Failed',
            Message=json.dumps(payload)
        )

        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Booking request failed: {error_message}'})
        }
