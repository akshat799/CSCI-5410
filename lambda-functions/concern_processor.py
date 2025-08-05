import json
import os
import uuid
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Attr
import random

dynamodb         = boto3.resource('dynamodb')
sns              = boto3.client('sns')

USERS_TABLE      = os.environ['USERS_TABLE']
CHATLOGS_TABLE   = os.environ['CHATLOGS_TABLE']
CONCERNS_TABLE   = os.environ['CONCERNS_TABLE']

def lambda_handler(event, context):
    table_users    = dynamodb.Table(USERS_TABLE)
    table_chatlogs = dynamodb.Table(CHATLOGS_TABLE)
    table_concerns = dynamodb.Table(CONCERNS_TABLE)

    for record in event['Records']:
        payload           = json.loads(record['Sns']['Message'])
        concern_id        = payload["concernId"]
        customer_id       = payload["userId"]
        text              = payload["description"]
        booking_reference = payload["bookingReference"]

        # 1) fetch all franchise operators
        resp      = table_users.scan(
            FilterExpression=Attr("role").eq("FranchiseOperator")
        )
        operators = [u["user_id"] for u in resp.get("Items", [])]
        if not operators:
            print("no operators found!")
            continue

        operator_id = random.choice(operators)

        # ✚ 2a) assign that operator to the concern
        try:
            table_concerns.update_item(
                Key={"concernId": concern_id},
                UpdateExpression="SET to_user = :op",
                ExpressionAttributeValues={":op": operator_id}
            )
            print(f"Assigned operator {operator_id} to concern {concern_id}")
        except Exception as e:
            print(f"Error updating concern {concern_id}: {e}")
            # (you might choose to continue or raise here)

        # 2b) build chat item
        chat_id = str(uuid.uuid4())
        ts      = datetime.utcnow().isoformat()

        item = {
            "chatId":           chat_id,           # hash key
            "concernId":        concern_id,        # GSI hash key
            "timestamp":        ts,                # range key
            "from":             customer_id,
            "to":               operator_id,
            "messageText":      text,
            "bookingReference": booking_reference
        }

        # 3) write into DynamoDB
        table_chatlogs.put_item(Item=item)
        print(f"Created chat item: {item}")

    return {"statusCode": 200}
