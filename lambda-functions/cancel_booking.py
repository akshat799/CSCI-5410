import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')

def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) else json.loads(event["body"])
        booking_ref = body.get("bookingReference")

        if not booking_ref:
            return {
                "statusCode": 400,
                "body": json.loads(json.dumps({"error": "Missing bookingReference"}))
            }

        # Update the status to "cancelled"
        bookings_table.update_item(
            Key={
                "bookingReference": booking_ref
            },
            UpdateExpression="SET #s = :cancelled",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":cancelled": "cancelled"}
        )

        return {
            "statusCode": 200,
            "body": json.loads(json.dumps({"message": f"Booking {booking_ref} cancelled successfully"}))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.loads(json.dumps({"error": str(e)}))
        }
