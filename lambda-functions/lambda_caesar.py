import boto3

dynamodb = boto3.resource('dynamodb')
caesar_table = dynamodb.Table('CaesarChallenge')

def lambda_handler(event, context):
    user_id = event.get('user_id')
    answer = event.get('answer', '').strip()

    if not user_id or not answer:
        return {"valid": False, "reason": "Missing user_id or answer"}

    try:
        response = caesar_table.get_item(Key={'user_id': user_id})
        item = response.get('Item')
        if not item:
            return {"valid": False, "reason": "User not found"}

        original_text = item.get('plainText', '')
        
        # The user should provide the decrypted plaintext
        # Compare their answer directly to the original plain text
        return {"valid": answer.lower() == original_text.lower()}

    except Exception as e:
        return {"valid": False, "reason": str(e)}