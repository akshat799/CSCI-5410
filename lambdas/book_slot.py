import json
import boto3
import uuid
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bookings_table = dynamodb.Table('Bookings')

def lambda_handler(event, context):
    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event.get('body', '{}'))

        scooter_id = body["scooterId"]
        scooter_type = body["scooterType"]
        user_id = body["userId"]
        date = body["date"]
        start_time = body["startTime"]
        end_time = body["endTime"]
        location = body["location"]

        requested_slot = {"startTime": start_time, "endTime": end_time, "location":location}

        # 1. Fetch availability
        response = availability_table.get_item(
            Key={"scooterId": scooter_id, "date": date}
        )
        if "Item" not in response:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "No availability found"})
            }

        slots = response["Item"].get("slots", [])

        if requested_slot not in slots:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Slot not available"})
            }

        # 2. Check for overlapping bookings
        bookings = bookings_table.scan(
            FilterExpression=Attr("scooterId").eq(scooter_id) &
                             Attr("date").eq(date) &
                             Attr("status").eq("booked")
        )

        for b in bookings.get("Items", []):
            booked_start = b["startTime"]
            booked_end = b["endTime"]
            if not (end_time <= booked_start or start_time >= booked_end):
                return {
                    "statusCode": 409,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Slot already booked"})
                }

        # 3. Save booking
        booking_id = str(uuid.uuid4())[:8].upper()
        bookings_table.put_item(
            Item={
                "bookingReference": booking_id,
                "scooterId": scooter_id,
                "scooterType": scooter_type,
                "userId": user_id,
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "location": location,
                "status": "booked"
            }
        )

        # 4. Remove booked slot from availability
        updated_slots = [slot for slot in slots if not (
            slot["startTime"] == start_time and slot["endTime"] == end_time and slot["location"] == location
        )]

        availability_table.update_item(
            Key={"scooterId": scooter_id, "date": date},
            UpdateExpression="SET slots = :slots",
            ExpressionAttributeValues={":slots": updated_slots}
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "message": "Slot booked successfully",
                "bookingReference": booking_id
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
