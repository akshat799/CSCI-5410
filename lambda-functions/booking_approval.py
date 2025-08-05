import boto3
import json
from datetime import datetime
import os

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')
availability_table = dynamodb.Table('Availability')
sns = boto3.client('sns')

FAILURE_TOPIC_ARN = os.environ['BOOKING_FAILURE_TOPIC_ARN']
CONFIRMATION_TOPIC_ARN = os.environ['BOOKING_CONFIRMATION_TOPIC_ARN']

def lambda_handler(event, context):
    for record in event['Records']:
        try:
            # Step 1: Parse outer body
            outer_body = json.loads(record['body'])

            # Step 2: Parse actual booking message (string inside "Message")
            message = json.loads(outer_body['Message'])

            booking_ref = message['booking_reference']
            print(f"Processing booking: {booking_ref}")
            print(f"Message: {message}")

            # Check availability
            slot_check = availability_table.get_item(
                Key={'bike_id': message['bike_id'], 'slot_id': message['slot_id']}
            )
            if 'Item' not in slot_check:
                raise LookupError(f"Slot {message['slot_id']} for bike {message['bike_id']} is no longer available")

            # Update booking status to booked
            bookings_table.update_item(
                Key={'booking_reference': booking_ref},
                UpdateExpression="""
                    SET #status = :booked,
                        startTime = :startTime,
                        endTime = :endTime,
                        updated_at = :updated_at
                """,
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':booked': 'booked',
                    ':startTime': message['startTime'],
                    ':endTime': message['endTime'],
                    ':updated_at': datetime.utcnow().isoformat()
                }
            )

            # Remove booked slot
            availability_table.delete_item(
                Key={'bike_id': message['bike_id'], 'slot_id': message['slot_id']}
            )

            # Publish confirmation to SNS
            sns.publish(
                TopicArn=CONFIRMATION_TOPIC_ARN,
                Subject='Booking Confirmed',
                Message=json.dumps({
                    'email': message['user_id'],
                    'subject': 'Your DALScooter Booking is Confirmed!',
                    'message': (
                        f"<p>Hi {message['user_id']},</p>"
                        f"<p>Your booking has been <strong>confirmed</strong> successfully.</p>"
                        f"<ul>"
                        f"<li><strong>Booking Reference:</strong> {booking_ref}</li>"
                        f"<li><strong>Bike ID:</strong> {message['bike_id']}</li>"
                        f"<li><strong>Time Slot:</strong> {message['startTime']} to {message['endTime']}</li>"
                        f"</ul>"
                        f"<p>Thank you for choosing <strong>DALScooter</strong>!</p>"
                        f"<p>– DALScooter Team</p>"
                    )
                })
            )

        except Exception as e:
            error_message = str(e)
            booking_ref = message.get('booking_reference', 'UNKNOWN')

            # Try to update booking status to failed
            try:
                bookings_table.update_item(
                    Key={'booking_reference': booking_ref},
                    UpdateExpression="""
                        SET #status = :failed,
                            updated_at = :updated_at
                    """,
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':failed': 'failed',
                        ':updated_at': datetime.utcnow().isoformat()
                    }
                )
            except Exception as update_err:
                print(f"Failed to update booking status: {update_err}")

            # Send failure to SNS
            sns.publish(
                TopicArn=FAILURE_TOPIC_ARN,
                Subject='Booking Approval Failed',
                Message=json.dumps({
                    'email': message.get('user_id', 'csci5408@gmail.com'),
                    'subject': 'Booking Request Failed',
                    'message': (
                        f"<p>Hi {message.get('user_id', 'User')},</p>"
                        f"<p>Unfortunately, your booking request could not be processed.</p>"
                        f"<p><strong>Error:</strong> {error_message}</p>"
                        f"<p>Please try again later or contact our support team if the issue persists.</p>"
                        f"<p>– DALScooter Team</p>"
                    )
                })
            )

    return {'statusCode': 200, 'body': json.dumps('All booking records processed')}
