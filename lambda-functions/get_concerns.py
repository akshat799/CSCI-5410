import os
import json
import boto3
from boto3.dynamodb.conditions import Attr

# Use the high-level resource interface
dynamodb   = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('CONCERNS_TABLE', 'Concerns')
table      = dynamodb.Table(TABLE_NAME)

# Common CORS headers
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
}

def lambda_handler(event, context):
    print(event)
    # Handle preflight OPTIONS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": ""
        }

    # extract the email from the JWT claims
    claims = event["requestContext"]["authorizer"]["claims"]
    email = claims.get("email")

    try:
        # build a filter: user_id == email OR to_user == email
        filter_expr = Attr("user_id").eq(email) | Attr("to_user").eq(email)

        # First page with filter
        response = table.scan(FilterExpression=filter_expr)
        concerns = response.get("Items", [])

        # Paginate through all remaining pages
        while "LastEvaluatedKey" in response:
            response = table.scan(
                ExclusiveStartKey=response["LastEvaluatedKey"],
                FilterExpression=filter_expr
            )
            concerns.extend(response.get("Items", []))

        return {
            "statusCode": 200,
            "headers": {
                **CORS_HEADERS,
                "Content-Type": "application/json"
            },
            "body": json.dumps({ "concerns": concerns })
        }

    except Exception as e:
        print("Error scanning Concerns table:", e)
        return {
            "statusCode": 500,
            "headers": {
                **CORS_HEADERS,
                "Content-Type": "application/json"
            },
            "body": json.dumps({ "error": str(e) })
        }
