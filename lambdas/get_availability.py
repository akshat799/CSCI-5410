import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        params = event.get('queryStringParameters') or {}

        scooter_id = params.get('scooterId') if 'scooterId' in params else None
        date = params.get('date') if 'date' in params else None

        filter_expr = None
        if scooter_id:
            filter_expr = Attr("scooterId").eq(scooter_id)
        if date:
            date_expr = Attr("date").eq(date)
            filter_expr = date_expr if not filter_expr else filter_expr & date_expr

        scan_args = {}
        if filter_expr:
            scan_args["FilterExpression"] = filter_expr

        response = table.scan(**scan_args)
        items = response.get("Items", [])


        if not items:
            return {
                "statusCode": 404,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "No availability found for the given criteria."})
            }

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(items)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }