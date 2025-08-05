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
            message = json.loads(record['body'])
            booking_ref = message['booking_reference']

            slot_check = availability_table.get_item(
                Key={'bike_id': message['bike_id'], 'slot_id': message['slot_id']}
            )
            if 'Item' not in slot_check:
                raise LookupError(f"Slot {message['slot_id']} for bike {message['bike_id']} is no longer available")

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

            availability_table.delete_item(
                Key={'bike_id': message['bike_id'], 'slot_id': message['slot_id']}
            )

            # Publish confirmation via SNS
            sns.publish(
                TopicArn=CONFIRMATION_TOPIC_ARN,
                Subject='Booking Confirmed',
                Message=json.dumps({
                    'type': 'booking_confirmation',
                    'booking_reference': booking_ref,
                    'user_id': message['user_id'],
                    'bike_id': message['bike_id'],
                    'startTime': message['startTime'],
                    'endTime': message['endTime'],
                    'timestamp': datetime.utcnow().isoformat()
                })
            )

        except Exception as e:
            error_message = str(e)
            failed_body = record['body']
            booking_ref = message.get('booking_reference', 'UNKNOWN')

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

            # Publish failure to SNS
            sns.publish(
                TopicArn=FAILURE_TOPIC_ARN,
                Subject='Booking Approval Failed',
                Message=json.dumps({
                    'type': 'booking_approval_failure',
                    'error': error_message,
                    'failed_booking': failed_body,
                    'timestamp': datetime.utcnow().isoformat()
                })
            )

    return {'statusCode': 200, 'body': json.dumps('All booking records processed')}
