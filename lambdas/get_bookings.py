import json
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bookings_table = dynamodb.Table('Bookings')

def get_user_groups(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    groups = claims.get('cognito:groups', '')
    return [groups] if isinstance(groups, str) and groups else groups

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError

def lambda_handler(event, context):
    allowed_groups = ['FranchiseOperator', 'RegisteredCustomer']
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
                    'headers': cors_headers(),
                    "body": json.dumps({"error": "Booking not found"})
                }
            return {
                "statusCode": 200,
                'headers': cors_headers(),
                "body": json.dumps(item, default=decimal_default)
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

        return {
            "statusCode": 200,
            'headers': cors_headers(),
            "body": json.dumps(items)
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
