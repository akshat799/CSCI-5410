import boto3

dynamodb = boto3.resource('dynamodb')
qa_table = dynamodb.Table('SecurityQA')
caesar_table = dynamodb.Table('CaesarChallenge')

def lambda_handler(event, context):
    user_id = event['userName']
    session = event['request'].get('session', [])

    if len(session) == 1:
        item = qa_table.get_item(Key={'user_id': user_id}).get('Item', {})
        question = item.get('question', 'Unknown question')
        event['response']['publicChallengeParameters'] = {'type': 'QA', 'question': question}
        event['response']['privateChallengeParameters'] = {'type': 'QA'}
        event['response']['challengeMetadata'] = 'QA'

    elif len(session) == 2:
        item = caesar_table.get_item(Key={'user_id': user_id}).get('Item', {})
        challenge_text = item.get('challenge_text', '')
        event['response']['publicChallengeParameters'] = {'type': 'CAESAR', 'challenge': challenge_text}
        event['response']['privateChallengeParameters'] = {'type': 'CAESAR'}
        event['response']['challengeMetadata'] = 'CAESAR'

    return event
