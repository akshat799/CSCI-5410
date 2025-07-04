import boto3

dynamodb = boto3.resource('dynamodb')
qa_table = dynamodb.Table('SecurityQA')

def lambda_handler(event, context):
    user_id = event.get('user_id')
    user_answer = event.get('answer', '').strip().lower()

    if not user_id or not user_answer:
        return {"valid": False, "reason": "Missing user_id or answer"}

    try:
        item = qa_table.get_item(Key={'user_id': user_id}).get('Item')
        if not item:
            return {"valid": False, "reason": "User not found"}

        correct_answer = item.get('answer', '').strip().lower()
        return {"valid": user_answer == correct_answer}

    except Exception as e:
        return {"valid": False, "reason": str(e)}
