import json
import boto3
import jwt

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Bookings')

COGNITO_USERPOOL_ID = "us-east-1_YhCFqNhoE"
APP_CLIENT_ID = "4mi9pp764n686omtihftgp0b3i"
REGION = "us-east-1"

def verify_jwt_token(token):
    from jwt import PyJWKClient
    jwks_url = f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}/.well-known/jwks.json"
    jwk_client = PyJWKClient(jwks_url)
    signing_key = jwk_client.get_signing_key_from_jwt(token)
    return jwt.decode(token, signing_key.key, algorithms=["RS256"], audience=APP_CLIENT_ID)

def lambda_handler(event, context):
    try:
        token = event["headers"]["Authorization"].split(" ")[1]
        verify_jwt_token(token)

        body = json.loads(event["body"])
        booking_ref = body["bookingReference"]

        table.update_item(
            Key={"bookingReference": booking_ref},
            UpdateExpression="set cancelled = :val",
            ExpressionAttributeValues={":val": True}
        )

        return {"statusCode": 200, "body": json.dumps({"message": "Booking cancelled"})}
    except Exception as e:
        return {"statusCode": 401, "body": json.dumps({"error": str(e)})}
