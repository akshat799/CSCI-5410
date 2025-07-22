import boto3
import json

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