import boto3

ddb = boto3.resource('dynamodb')
qa_table     = ddb.Table('SecurityQA')
caesar_table = ddb.Table('CaesarChallenge')

def lambda_handler(event, context):
    user    = event['userName']
    session = event['request'].get('session', [])

    if len(session) == 2 and session[1]['challengeName'] == "PASSWORD_VERIFIER" and session[1]['challengeResult']:
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

    elif len(session) == 3 and session[2]['challengeName'] == "CUSTOM_CHALLENGE" and session[1]['challengeResult']:
        item       = caesar_table.get_item(Key={'user_id': user}).get('Item', {})
        cipher     = item.get('challengeText', '')
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

    return event
