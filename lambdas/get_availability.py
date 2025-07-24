import json
import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def get_user_groups(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
    groups = claims.get('cognito:groups', '')
    return [groups] if isinstance(groups, str) and groups else groups

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
                'headers': cors_headers(),
                "body": json.dumps({"error": "No availability found for the given criteria."})
            }

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