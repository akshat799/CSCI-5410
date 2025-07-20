import boto3
import json
import jwt
import urllib.request
import traceback

COGNITO_USERPOOL_ID = "us-east-1_YhCFqNhoE"
APP_CLIENT_ID = "4mi9pp764n686omtihftgp0b3i"
REGION = "us-east-1"

def verify_jwt(token):
    keys_url = f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}/.well-known/jwks.json"
    with urllib.request.urlopen(keys_url) as f:
        jwks = json.loads(f.read().decode("utf-8"))["keys"]

    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    key = next((k for k in jwks if k["kid"] == kid), None)
    if not key:
        raise Exception("Public key not found in JWKs")

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))

    decoded = jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        audience=APP_CLIENT_ID
    )

    print("JWT decoded successfully:", decoded)
    return decoded

def get_event_body(event):
    if "Authorization" not in event.get("headers", {}):
        raise Exception("Missing Authorization header")

    token = event["headers"]["Authorization"].split(" ")[1]
    print("Verifying token:", token)
    decoded_token = verify_jwt(token)

    user_id = decoded_token.get("sub", "unknown")

    body = json.loads(event["body"]) if event.get("body") else event
    return body, user_id

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        body, user_id = get_event_body(event)
        print("Parsed body:", body)
        print("User ID from token:", user_id)

        scooter_id = body['scooterId']
        date = body['date']
        slots = body['slots']

        if not isinstance(slots, list):
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Slots must be a list"})
            }

        table.put_item(
            Item={
                'scooterId': scooter_id,
                'date': date,
                'slots': slots
            }
        )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Availability added/updated"})
        }

    except Exception as e:
        print("Exception occurred:")
        traceback.print_exc()
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
