import json
import boto3
import os

quicksight = boto3.client('quicksight')

def lambda_handler(event, context):
    try:
        # Extract user email from JWT token
        user_email = event['requestContext']['authorizer']['claims']['email']
        
        # Register user in QuickSight if not already registered
        try:
            quicksight.register_user(
                AwsAccountId=os.environ['AWS_ACCOUNT_ID'],
                Namespace='default',
                IdentityType='IAM',
                Email=user_email,
                UserRole='READER',
                IamArn=f"arn:aws:iam::{os.environ['AWS_ACCOUNT_ID']}:role/lambda_mfa_role"
            )
        except quicksight.exceptions.ResourceExistsException:
            pass  # User already registered

        # Generate embed URL for analytics dashboard
        response = quicksight.generate_embed_url_for_registered_user(
            AwsAccountId=os.environ['AWS_ACCOUNT_ID'],
            UserArn=f"arn:aws:quicksight:us-east-1:{os.environ['AWS_ACCOUNT_ID']}:user/default/{user_email}",
            SessionLifetimeInMinutes=600,
            AllowedDomains=[
                'http://localhost:3000',
                'http://localhost:8080',
                'http://localhost',
                'https://dalscooter.com'
            ],
            ExperienceConfiguration={
                'Dashboard': {
                    'InitialDashboardId': 'dalscooter-franchise-analytics'
                }
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'embedUrl': response['EmbedUrl']}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            }
        }
    except Exception as e:
        print(f"Error generating embed URL: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }