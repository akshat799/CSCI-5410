import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    auth_header = event['headers'].get('Authorization', '')
    print("Authorization Header:", auth_header)

    try:
        body = json.loads(event.get('body', '{}'))
        scooter_id = body['scooterId']
        scooter_type = body['scooterType']
        date = body['date']
        slots = body['slots']
        # slots would contain startTime, endTime, location

        if not isinstance(slots, list):
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "Slots must be a list"})
            }

        table.put_item(
            Item={
                'scooterId': scooter_id,
                'scooterType':scooter_type,
                'date': date,
                'slots': slots
            }
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"message": "Slots added successfully"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }
