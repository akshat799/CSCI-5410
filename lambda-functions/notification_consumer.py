import os
import json
import boto3

ses            = boto3.client('ses')
FROM_ADDRESS   = os.environ['SES_FROM_ADDRESS']
TEMPLATE_NAME  = os.environ['SES_TEMPLATE_NAME']

def lambda_handler(event, context):
    for record in event['Records']:
        try:
            envelope = json.loads(record['body'])
        except json.JSONDecodeError:
            print("Malformed SQS message, skipping:", record['body'])
            continue

        try:
            payload = json.loads(envelope.get('Message', '{}'))
        except json.JSONDecodeError:
            print("Malformed SNS Message field, skipping:", envelope.get('Message'))
            continue

        email   = payload.get('email')
        subject = payload.get('subject', 'Notification from DALScooter')
        message = payload.get('message', '')

        if not email:
            print("No email address provided, skipping:", payload)
            continue

        try:
            ses.send_templated_email(
                Source       = FROM_ADDRESS,
                Destination  = {'ToAddresses': [email]},
                Template     = TEMPLATE_NAME,
                TemplateData = json.dumps({
                  'subject': subject,
                  'message': message
                })
            )
            print(f"Templated notification sent to {email}")
        except Exception as e:
            print(f"Error sending templated email to {email}: {e}")
