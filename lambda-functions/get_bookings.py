import json
import boto3
from boto3.dynamodb.conditions import Attr
from decimal import Decimal

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
