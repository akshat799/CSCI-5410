import os
import json
import boto3
import random
import datetime

ddb             = boto3.resource('dynamodb')
qa_table        = ddb.Table('SecurityQA')
caesar_table    = ddb.Table('CaesarChallenge')
users_table     = ddb.Table('Users')
cognito_client  = boto3.client('cognito-idp')
sns_client      = boto3.client('sns')

REG_TOPIC_ARN = os.environ.get('REGISTRATION_TOPIC_ARN')


def apply_caesar_cipher(text, shift):
    result = ''
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result


def lambda_handler(event, context):
    if event.get('triggerSource') != 'PostConfirmation_ConfirmSignUp':
        return event

    user_id = event['userName']
    attrs   = event['request']['userAttributes']
    pool_id = event['userPoolId']

    users_table.put_item(Item={
        'user_id':    user_id,
        'email':      attrs.get('email'),
        'role':       attrs.get('custom:role', 'User'),
        'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

    qa_table.put_item(Item={
        'user_id':     user_id,
        'secQuestion': attrs.get('custom:secQuestion', ''),
        'secAnswer':   attrs.get('custom:secAnswer', '').strip().lower()
    })

    plain_text = attrs.get('custom:plainText', 'default')
    try:
        shift = int(attrs.get('custom:shiftKey', 0))
    except (TypeError, ValueError):
        shift = random.randint(1, 25)

    challenge_text = apply_caesar_cipher(plain_text, shift)
    caesar_table.put_item(Item={
        'user_id':       user_id,
        'plainText':     plain_text,
        'shift':         shift,
        'challengeText': challenge_text
    })

    role = attrs.get('custom:role', 'User')
    if role not in ['RegisteredCustomer', 'FranchiseOperator']:
        raise ValueError(f"Invalid role: {role}")

    cognito_client.admin_add_user_to_group(
        UserPoolId=pool_id,
        Username=user_id,
        GroupName=role
    )

    if REG_TOPIC_ARN:
        payload = {
            'email':   attrs.get('email'),
            'subject': 'Welcome to DALScooter!',
            'message': (
                f"Hi {attrs.get('name')},\n\n"
                "Thank you for registering with DALScooter. "
                "You now have full access to our fleet of e-bikes and exclusive features:\n"
                " • Book rides instantly from our app\n"
                " • Track and manage your trips\n\n"
                "Happy riding!"
            )
        }
        try:
            sns_client.publish(
                TopicArn=REG_TOPIC_ARN,
                Message=json.dumps(payload)
            )
        except Exception as e:
            print(f"Error sending SNS registration notification: {e}")

    return event
