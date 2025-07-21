import json
import boto3
import uuid
import jwt

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')
bookings_table = dynamodb.Table('Bookings')

COGNITO_USERPOOL_ID = "us-east-1_YhCFqNhoE"
APP_CLIENT_ID = "4mi9pp764n686omtihftgp0b3i"
REGION = "us-east-1"

def verify_jwt_token(token):
    from jwt import PyJWKClient
    jwk_client = PyJWKClient(f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}/.well-known/jwks.json")
    signing_key = jwk_client.get_signing_key_from_jwt(token)
    decoded_token = jwt.decode(token, signing_key.key, algorithms=["RS256"], audience=APP_CLIENT_ID)
    return decoded_token

def lambda_handler(event, context):
    try:
        token = event["headers"]["Authorization"].split(" ")[1]
        verify_jwt_token(token)

        body = json.loads(event["body"])
        scooter_id = body["scooterId"]
        date = body["date"]
        slot = body["slot"]

        availability = availability_table.get_item(Key={"scooterId": scooter_id, "date": date}).get("Item")
        if not availability:
            return {"statusCode": 404, "body": json.dumps({"error": "No availability found"})}

        if slot not in availability["slots"]:
            return {"statusCode": 400, "body": json.dumps({"error": "Slot not available"})}

        availability["slots"].remove(slot)
        availability_table.put_item(Item=availability)

        bookings_table.put_item(Item={
            "bookingReference": str(uuid.uuid4()),
            "scooterId": scooter_id,
            "date": date,
            "slot": slot
        })

        return {"statusCode": 200, "body": json.dumps({"message": "Slot booked successfully"})}
    except Exception as e:
        return {"statusCode": 401, "body": json.dumps({"error": str(e)})}
