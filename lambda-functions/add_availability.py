import boto3
import json
import jwt
import urllib.request

COGNITO_USERPOOL_ID = "us-east-1_eSpO3xVoo"
APP_CLIENT_ID = "2d8qd5us515158b4knocrgapoh"
REGION = "us-east-1"

# Download and cache JWKs
keys_url = f"https://cognito-idp.{REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}/.well-known/jwks.json"
with urllib.request.urlopen(keys_url) as f:
    response = f.read()
    jwks = json.loads(response.decode("utf-8"))["keys"]

def verify_jwt(token):
    headers = jwt.get_unverified_header(token)
    kid = headers["kid"]
    key = next((k for k in jwks if k["kid"] == kid), None)
    if not key:
        raise Exception("Public key not found in JWKs")

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
    decoded = jwt.decode(token, public_key, algorithms=["RS256"], audience=APP_CLIENT_ID)
    return decoded

def get_event_body(event):
    if "Authorization" not in event.get("headers", {}):
        raise Exception("Missing Authorization header")
    token = event["headers"]["Authorization"].split(" ")[1]
    decoded_token = verify_jwt(token)
    user_id = decoded_token["sub"]

    if event.get("body"):
        body = json.loads(event["body"])
    else:
        body = event
    return body, user_id


dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body']) if 'body' in event else event
        scooter_id = body['scooterId']
        date = body['date']
        slots = body['slots']

        if not isinstance(slots, list):
            return {"statusCode": 400, "body": json.loads(json.dumps({"error": "Slots must be a list"}))}

        table.put_item(
            Item={
                'scooterId': scooter_id,
                'date': date,
                'slots': slots
            }
        )

        return {
            "statusCode": 200,
            "body": json.loads(json.dumps({"message": "Availability added/updated"}))
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.loads(json.dumps({"error": str(e)}))}
