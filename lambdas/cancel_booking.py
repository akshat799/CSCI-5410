import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')
availability_table = dynamodb.Table('Availability')

def get_user_groups(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    groups = claims.get('cognito:groups', '')
    return [groups] if isinstance(groups, str) and groups else groups

def lambda_handler(event, context):
    allowed_groups = ['RegisteredCustomer']
    user_groups = get_user_groups(event)

    if not any(group in allowed_groups for group in user_groups):
        return {
            "statusCode": 403,
            'headers': cors_headers(),
            "body": json.dumps({"message": "Access Denied", "user_groups": user_groups})
        }

    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event.get("body", "{}"))
        booking_ref = body.get("bookingReference")

        if not booking_ref:
            return {
                "statusCode": 400,
                'headers': cors_headers(),
                "body": json.dumps({"error": "Missing booking reference"})
            }

        # Fetch the booking
        booking = bookings_table.get_item(Key={"bookingReference": booking_ref})
        if "Item" not in booking:
            return {
                "statusCode": 404,
                'headers': cors_headers(),
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
            'headers': cors_headers(),
            "body": json.dumps({"message": "Booking cancelled and slot restored"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            'headers': cors_headers(),
            "body": json.dumps({"error": str(e)})
        }

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
    }