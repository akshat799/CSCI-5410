import boto3
import json
import os

quicksight = boto3.client('quicksight')
cognito = boto3.client('cognito-idp')

USER_POOL_ID = os.environ['USER_POOL_ID']
AWS_ACCOUNT_ID = os.environ['AWS_ACCOUNT_ID']

def lambda_handler(event, context):
    try:
        # Extract user and group details from CloudWatch event
        detail = event['detail']
        user_name = detail['requestParameters']['userName']
        group_name = detail['requestParameters']['groupName']
        operation = detail['eventName']  # AdminAddUserToGroup or AdminRemoveUserFromGroup

        if group_name != 'FranchiseOperator':
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Not a FranchiseOperator group, skipping'})
            }

        # Get user email
        user = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=user_name
        )
        email = next(attr['Value'] for attr in user['UserAttributes'] if attr['Name'] == 'email')

        if operation == 'AdminAddUserToGroup':
            # Register user in QuickSight
            try:
                quicksight.register_user(
                    AwsAccountId=AWS_ACCOUNT_ID,
                    Namespace='default',
                    IdentityType='IAM',
                    Email=email,
                    UserRole='READER',
                    IamArn=f"arn:aws:iam::{AWS_ACCOUNT_ID}:role/lambda_mfa_role"
                )
                print(f"Registered user {email} in QuickSight")
            except quicksight.exceptions.ResourceExistsException:
                print(f"User {email} already registered in QuickSight")

        elif operation == 'AdminRemoveUserFromGroup':
            # Delete user from QuickSight
            try:
                quicksight.delete_user(
                    UserName=email,
                    AwsAccountId=AWS_ACCOUNT_ID,
                    Namespace='default'
                )
                print(f"Deleted user {email} from QuickSight")
            except quicksight.exceptions.ResourceNotFoundException:
                print(f"User {email} not found in QuickSight")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processed user sync successfully'})
        }
    except Exception as e:
        print(f"Error syncing user: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }