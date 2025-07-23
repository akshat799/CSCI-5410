import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def get_user_groups(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    groups = claims.get('cognito:groups', '')
    return [groups] if isinstance(groups, str) and groups else groups

def lambda_handler(event, context):
    allowed_groups = ['FranchiseOperator']
    user_groups = get_user_groups(event)

    if not any(group in allowed_groups for group in user_groups):
        return {
            "statusCode": 403,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            "body": json.dumps({"message": "Access Denied", "user_groups": user_groups})
        }

    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event.get('body', '{}'))

        scooter_id = body.get("scooterId")
        date = body.get("date")
        updated_slots = body.get("slots")

        if not (scooter_id and date and isinstance(updated_slots, list)):
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Missing or invalid input fields"})
            }

        # Check if item exists
        existing = table.get_item(Key={"scooterId": scooter_id, "date": date})
        if "Item" not in existing:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Availability record not found"})
            }

        # Update the slots
        table.update_item(
            Key={"scooterId": scooter_id, "date": date},
            UpdateExpression="SET slots = :slots",
            ExpressionAttributeValues={":slots": updated_slots}
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Availability updated successfully"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
