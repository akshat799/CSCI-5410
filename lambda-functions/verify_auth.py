import os
import json
import boto3

dynamodb     = boto3.resource('dynamodb')
qa_table     = dynamodb.Table('SecurityQA')
caesar_table = dynamodb.Table('CaesarChallenge')

sns_client   = boto3.client('sns')
LOGIN_TOPIC  = os.environ.get('LOGIN_TOPIC_ARN')


def lambda_handler(event, context):
    user_id  = event['userName']
    answer   = event['request']['challengeAnswer']
    metadata = event['request'].get('privateChallengeParameters', {})
    passed   = False

    if metadata.get('challenge_type') == 'QA':
        item    = qa_table.get_item(Key={'user_id': user_id}).get('Item', {})
        correct = item.get('secAnswer', '').strip().lower()
        passed  = (answer.strip().lower() == correct)

    elif metadata.get('challenge_type') == 'CAESAR':
        correct = metadata.get('expected_answer', '').strip().lower()
        passed  = (answer.strip().lower() == correct)

    event['response']['answerCorrect'] = passed

    if metadata.get('challenge_type') == 'CAESAR' and passed and LOGIN_TOPIC:
        email   = event['request']['userAttributes'].get('email')
        payload = {
            'email':   email,
            'subject': 'Welcome Back to DALScooter!',
            'message': (
                f"Hi {user_id},\n\n"
                "You’ve successfully logged into your DALScooter account.\n\n"
                "What’s new:\n"
                " • Quick-start rides right from the app home screen\n"
                " • Real-time trip tracking and history\n"
                " • Enhanced rewards dashboard to earn more with every ride\n\n"
                "If this wasn’t you, please reset your password immediately.\n\n"
                "Happy riding!\n"
            )
        }
        try:
            sns_client.publish(
                TopicArn=LOGIN_TOPIC,
                Message=json.dumps(payload)
            )
        except Exception as e:
            print(f"Error sending SNS login notification: {e}")

    return event
