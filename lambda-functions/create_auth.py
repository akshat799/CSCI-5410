import boto3

ddb = boto3.resource('dynamodb')
qa_table     = ddb.Table('SecurityQA')
caesar_table = ddb.Table('CaesarChallenge')

def lambda_handler(event, context):
    user    = event['userName']
    session = event['request'].get('session', [])

    # First CUSTOM_CHALLENGE → Security Question
    if len(session) == 0:
        item = qa_table.get_item(Key={'user_id': user}).get('Item', {})
        question = item.get('secQuestion', 'What is your secret?')
        answer   = item.get('secAnswer', '').strip().lower()

        event['response']['publicChallengeParameters'] = {
            'challenge_type':  'QA',
            'question':        question
        }
        event['response']['privateChallengeParameters'] = {
            'challenge_type':    'QA',
            'expected_answer':   answer
        }
        event['response']['challengeMetadata'] = 'QA'

    # Second CUSTOM_CHALLENGE → Caesar cipher
    else:
        item       = caesar_table.get_item(Key={'user_id': user}).get('Item', {})
        cipher     = item.get('challenge_text', '')
        plaintext  = item.get('plainText', '').strip().lower()

        event['response']['publicChallengeParameters'] = {
            'challenge_type': 'CAESAR',
            'ciphertext':     cipher
        }
        event['response']['privateChallengeParameters'] = {
            'challenge_type':    'CAESAR',
            'expected_answer':   plaintext
        }
        event['response']['challengeMetadata'] = 'CAESAR'

    # Cognito will use the DefineAuthChallenge to set challengeName
    return event
