import boto3
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
availability_table = dynamodb.Table('Availability')

def lambda_handler(event, context):
    try:
        # Extract user info from Cognito JWT token
        claims = event['requestContext']['authorizer']['claims']
        user_groups = claims.get('cognito:groups', [])
        if isinstance(user_groups, str):
            user_groups = [user_groups] if user_groups else []

        if 'FranchiseOperator' not in user_groups:
            return {
                'statusCode': 403,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Access denied. Franchise operators only.'})
            }

        body = json.loads(event.get('body', '{}'))
        bike_id = body.get('bike_id')
        slot_id = body.get('slot_id')
        action = body.get('action')  # 'update' or 'remove'
        slot_data = body.get('slot', {})

        if action == 'remove':
            availability_table.delete_item(Key={'bike_id': bike_id, 'slot_id': slot_id})
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Availability slot removed successfully'})
            }
        elif action == 'update':
            # Verify slot exists
            slot_response = availability_table.get_item(Key={'bike_id': bike_id, 'slot_id': slot_id})
            if 'Item' not in slot_response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'message': 'Slot not found'})
                }

            # Update slot
            update_expression = 'SET startTime = :startTime, endTime = :endTime, updated_at = :updated_at'
            expression_values = {
                ':startTime': slot_data.get('startTime'),
                ':endTime': slot_data.get('endTime'),
                ':updated_at': datetime.utcnow().isoformat()
            }
            availability_table.update_item(
                Key={'bike_id': bike_id, 'slot_id': slot_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values
            )

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Availability slot updated successfully'})
            }
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'message': 'Invalid action'})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'message': f'Error: {str(e)}'})
        }