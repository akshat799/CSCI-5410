import json
import boto3
import os
import time

dynamodb = boto3.client('dynamodb')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        bucket = os.environ['ANALYTICS_BUCKET']
        tables = ['Users', 'Logins']
        export_arns = []

        for table in tables:
            export_time = int(time.time())
            export_path = f"{table.lower()}/AWSDynamoDB/{export_time}/data/"
            response = dynamodb.export_table_to_point_in_time(
                TableArn=f"arn:aws:dynamodb:us-east-1:{os.environ['AWS_ACCOUNT_ID']}:table/{table}",
                S3Bucket=bucket,
                S3Prefix=export_path,
                ExportFormat='DYNAMODB_JSON'
            )
            export_arns.append(response['ExportDescription']['ExportArn'])

        for export_arns in export_arns:
            while True:
                export_status = dynamodb.describe_export(ExportArn=export_arn)
                status = export_status['ExportDescription']['ExportStatus']
                if status in ['COMPLETED', 'FAILED']:
                    if status == 'FAILED':
                        return {
                            'statusCode': 500,
                            'body': json.dumps({'error': f'Export failed for {export_arn}'})
                        }
                    break
                time.sleep(5)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Export initiated successfully', 'export_arns': export_arns})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }