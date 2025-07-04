import boto3

dynamodb = boto3.resource('dynamodb')
caesar_table = dynamodb.Table('CaesarChallenge')

def apply_caesar(cipher_text, shift):
    result = ''
    for char in cipher_text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base - shift) % 26 + base)
        else:
            result += char
    return result

def lambda_handler(event, context):
    user_id = event.get('user_id')
    answer = event.get('answer', '').strip()

    if not user_id or not answer:
        return {"valid": False, "reason": "Missing user_id or answer"}

    try:
        item = caesar_table.get_item(Key={'user_id': user_id}).get('Item')
        if not item:
            return {"valid": False, "reason": "User not found"}

        original_text = item.get('original_text', '')
        shift = int(item.get('shift', 0))

        decrypted = apply_caesar(answer, shift)
        return {"valid": decrypted == original_text}

    except Exception as e:
        return {"valid": False, "reason": str(e)}
