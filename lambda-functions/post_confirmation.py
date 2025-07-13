import os
import boto3
import random


ddb = boto3.resource('dynamodb')
qa_table = ddb.Table('SecurityQA')
caesar_table = ddb.Table('CaesarChallenge')
users_table = ddb.Table('Users')

def apply_caesar_cipher(text, shift):
    """Apply Caesar cipher with given shift"""
    result = ''
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result

def lambda_handler(event, context):
    # Only run on a successful sign-up confirmation
    if event.get('triggerSource') == 'PostConfirmation_ConfirmSignUp':
        user = event['userName']
        attrs = event['request']['userAttributes']

        user_id = event['userName']
        attrs = event['request']['userAttributes']

        # 1. Store basic user info
        users_table.put_item(Item={
            'user_id': user_id,
            'email': attrs.get('email'),
            'created_at': attrs.get('sub')
        })

        # Extract and normalize the custom attributes
        question = attrs.get('custom:secQuestion', '')
        answer = attrs.get('custom:secAnswer', '').strip().lower()

        # 1) Store Security Q/A in its table
        qa_table.put_item(Item={
            'user_id': user,
            'secQuestion': question,
            'secAnswer': answer
        })

        # 2) Generate Caesar cipher challenge
        plain_text = 'dal scooter'
        shift = random.randint(1, 25)
        challenge_text = apply_caesar_cipher(plain_text, shift)
        
        caesar_table.put_item(Item={
            'user_id': user,
            'plainText': plain_text,
            'shift': shift,
            'challenge_text': challenge_text
        })

    # Always return the event, unmodified
    return event


