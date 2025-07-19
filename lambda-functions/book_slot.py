import json
import boto3
import uuid
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bookings_table = dynamodb.Table('Bookings')

def lambda_handler(event, context):
    try:
        body = event if isinstance(event, dict) and 'scooterId' in event else json.loads(event["body"])
        
        scooter_id = body["scooterId"]
        user_id = body["userId"]
        date = body["date"]
        start_time = body["startTime"]
        end_time = body["endTime"]

        # 1. Fetch availability
        availability_response = availability_table.get_item(
            Key={
                "scooterId": scooter_id,
                "date": date
            }
        )

        if "Item" not in availability_response:
            return {
                "statusCode": 404,
                "body": json.loads(json.dumps({"error": "No availability found"}))
            }

        available_slots = availability_response["Item"].get("slots", [])

        # 2. Check if requested slot is in available slots
        requested_slot = {"start": start_time, "end": end_time}
        if requested_slot not in available_slots:
            return {
                "statusCode": 400,
                "body": json.loads(json.dumps({"error": "Requested slot not available"}))
            }

        # 3. Check for overlapping bookings
        existing_bookings = bookings_table.scan(
            FilterExpression=Attr("scooterId").eq(scooter_id) &
                             Attr("date").eq(date) &
                             Attr("status").eq("booked")
        )

        for booking in existing_bookings.get("Items", []):
            booked_start = booking["startTime"]
            booked_end = booking["endTime"]

            if not (end_time <= booked_start or start_time >= booked_end):
                return {
                    "statusCode": 409,
                    "body": json.loads(json.dumps({"error": "Slot already booked"}))
                }

        # 4. Add booking to Bookings table
        booking_id = str(uuid.uuid4())[:8].upper()

        bookings_table.put_item(
            Item={
                "bookingReference": booking_id,
                "scooterId": scooter_id,
                "userId": user_id,
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "status": "booked"
            }
        )

        return {
            "statusCode": 200,
            "body": json.loads(json.dumps({
                "message": "Slot booked successfully",
                "bookingReference": booking_id
            }))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.loads(json.dumps({"error": str(e)}))
        }
