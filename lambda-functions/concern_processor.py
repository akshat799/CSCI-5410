import json
import os
import uuid
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Attr
import random

dynamodb = boto3.resource('dynamodb')
sns      = boto3.client('sns')

USERS_TABLE     = os.environ['USERS_TABLE']
CHATLOGS_TABLE  = os.environ['CHATLOGS_TABLE']

def lambda_handler(event, context):
    table_users    = dynamodb.Table(USERS_TABLE)
    table_chatlogs = dynamodb.Table(CHATLOGS_TABLE)

    for record in event['Records']:
        payload = json.loads(record['Sns']['Message'])

        concern_id  = payload["concernId"]
        customer_id = payload["userId"]
        text        = payload["description"]

        # 1) fetch all franchise operators
        resp = table_users.scan(
            FilterExpression=Attr("role").eq("FranchiseOperator")
        )
        operators = [u["user_id"] for u in resp.get("Items", [])]
        if not operators:
            print("no operators found!")
            continue

        operator_id = random.choice(operators)

        # 2) build chat item
        chat_id   = str(uuid.uuid4())
        ts        = datetime.utcnow().isoformat()

        item = {
            "chatId"     : chat_id,
            "concernId"  : concern_id,
            "from"       : customer_id,
            "to"         : operator_id,
            "messageText": text,
            "timestamp"  : ts
        }

        # 3) write into DynamoDB
        table_chatlogs.put_item(Item=item)

    return {"statusCode": 200}
