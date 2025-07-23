import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')
availability_table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event.get("body", "{}"))
        booking_ref = body.get("bookingReference")

        if not booking_ref:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing booking reference"})
            }

        # Fetch the booking
        booking = bookings_table.get_item(Key={"bookingReference": booking_ref})
        if "Item" not in booking:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Booking not found"})
            }

        booking_item = booking["Item"]

        # Update booking status to cancelled
        bookings_table.update_item(
            Key={"bookingReference": booking_ref},
            UpdateExpression="SET #s = :cancelled",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":cancelled": "cancelled"}
        )

        # Restore slot to availability
        scooter_id = booking_item["scooterId"]
        date = booking_item["date"]
        restored_slot = {
            "startTime": booking_item["startTime"],
            "endTime": booking_item["endTime"],
            "location": booking_item["location"]
        }

        availability = availability_table.get_item(Key={"scooterId": scooter_id, "date": date})
        if "Item" in availability:
            slots = availability["Item"].get("slots", [])
        else:
            slots = []

        slots.append(restored_slot)

        availability_table.put_item(
            Item={
                "scooterId": scooter_id,
                "date": date,
                "slots": slots
            }
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Booking cancelled and slot restored"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
