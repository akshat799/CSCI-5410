import boto3
import hashlib
import os

# DynamoDB tables (hard-coded names)
dynamodb = boto3.resource('dynamodb')
qa_table = dynamodb.Table('SecurityQA')
caesar_table = dynamodb.Table('CaesarChallenge')


def lambda_handler(event, context):
    user = event['userName']
    answer = event['request']['challengeAnswer']
    metadata = event['request'].get('privateChallengeParameters', {})
    passed = False

    if metadata.get('challenge_type') == 'QA':
        # fetch correct answer
        item = qa_table.get_item(Key={'user_id': user}).get('Item', {})
        correct = item.get('secAnswer', '').strip().lower()
        passed = (answer.strip().lower() == correct)

    elif metadata.get('challenge_type') == 'CAESAR':
        # expected_answer was the plaintext
        correct = metadata.get('expected_answer', '').strip().lower()
        passed = (answer.strip().lower() == correct)
        print(f"Expected answer: {correct}", passed)

    event['response']['answerCorrect'] = passed
    return event
