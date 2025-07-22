import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event['body']) if 'body' in event else event

        scooter_id = body.get("scooterId")
        date = body.get("date")
        updated_slots = body.get("slots")

        if not (scooter_id and date and isinstance(updated_slots, list)):
            return {
                "statusCode": 400,
                "body": json.loads(json.dumps({"error": "Missing or invalid input fields"}))
            }

        # Check if the item exists
        existing = table.get_item(Key={"scooterId": scooter_id, "date": date})
        if "Item" not in existing:
            return {
                "statusCode": 404,
                "body": json.loads(json.dumps({"error": "Availability record not found"}))
            }

        # Update the slots
        table.update_item(
            Key={"scooterId": scooter_id, "date": date},
            UpdateExpression="SET slots = :slots",
            ExpressionAttributeValues={":slots": updated_slots}
        )

        return {
            "statusCode": 200,
            "body": json.loads(json.dumps({"message": "Availability updated successfully"}))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.loads(json.dumps({"error": str(e)}))
        }