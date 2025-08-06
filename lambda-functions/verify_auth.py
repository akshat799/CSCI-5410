import os
import json
import boto3
from datetime import datetime

dynamodb     = boto3.resource('dynamodb')
qa_table     = dynamodb.Table('SecurityQA')
caesar_table = dynamodb.Table('CaesarChallenge')
logins_table = dynamodb.Table('Logins')

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
        role = event['request']['userAttributes'].get('custom:role', 'unknown')

        logins_table = dynamodb.Table('Logins')
        logins_table.put_item(Item={
            'login_id': f"{user_id}#{context.aws_request_id}",
            'user_id': user_id,
            'role': role,
            'email': event['request']['userAttributes'].get('email'),
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'success'
        })
            
        payload = {
            'email':   email,
            'subject': 'Welcome Back to DALScooter!',
            'message': (
                f"<p>Hi {user_id},</p>"
                f"<p>You’ve successfully logged into your DALScooter account.</p>"
                f"<p><strong>What’s new:</strong></p>"
                f"<ul>"
                f"<li>Quick-start rides right from the app home screen</li>"
                f"<li>Real-time trip tracking and history</li>"
                f"<li>Enhanced rewards dashboard to earn more with every ride</li>"
                f"</ul>"
                f"<p>If this wasn’t you, please reset your password immediately.</p>"
                f"<p>Happy riding!<br />– DALScooter Team</p>"
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
