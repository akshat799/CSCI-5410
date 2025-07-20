import json
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal
import jwt
import urllib.request

COGNITO_USERPOOL_ID = "us-east-1_YhCFqNhoE"
APP_CLIENT_ID = "4mi9pp764n686omtihftgp0b3i"
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
bookings_table = dynamodb.Table('Bookings')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        params = event.get("queryStringParameters") or {}
        booking_ref = params.get("bookingReference")
        user_id_filter = params.get("userId")
        status_filter = params.get("status")

        # If bookingReference is provided, directly fetch item
        if booking_ref:
            result = bookings_table.get_item(Key={"bookingReference": booking_ref})
            item = result.get("Item")
            if not item:
                return {
                    "statusCode": 404,
                    "body": json.loads(json.dumps({"error": "Booking not found"}))
                }
            return {
                "statusCode": 200,
                "body": json.loads(json.dumps(item, default=decimal_default))
            }

        # Otherwise, use scan with filters
        filter_expr = None

        if user_id_filter:
            filter_expr = Attr("userId").eq(user_id_filter)

        if status_filter:
            status_expr = Attr("status").eq(status_filter)
            filter_expr = status_expr if not filter_expr else filter_expr & status_expr

        scan_args = {}
        if filter_expr:
            scan_args["FilterExpression"] = filter_expr

        response = bookings_table.scan(**scan_args)
        items = response.get("Items", [])
        clean_items = json.loads(json.dumps(items, default=decimal_default))

        return {
            "statusCode": 200,
            "body": json.loads(json.dumps(clean_items))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.loads(json.dumps({"error": str(e)}))
        }
