import boto3
import gzip
import json
from datetime import datetime, timedelta

s3 = boto3.client('s3')

# CONFIG
SOURCE_BUCKET = 'aws-cloudtrail-logs-370161336954-d026cf1a'
DEST_BUCKET = 'dalscooter-processed-cloudtrail-logs'
ACCOUNT_ID = '370161336954'
REGION = 'us-east-1'
DAYS_TO_FETCH = 7  # Last 7 days including today

# Extract only useful fields
def extract_fields(record):
    return {
        "eventTime": record.get("eventTime"),
        "eventName": record.get("eventName"),
        "eventSource": record.get("eventSource"),
        "awsRegion": record.get("awsRegion"),
        "sourceIPAddress": record.get("sourceIPAddress"),
        "errorCode": record.get("errorCode"),
        "errorMessage": record.get("errorMessage"),
        "userName": record.get("userIdentity", {}).get("userName"),
        "principalId": record.get("userIdentity", {}).get("principalId"),
        "accountId": record.get("userIdentity", {}).get("accountId"),
        "requestID": record.get("requestID"),
        "request_roleName": record.get("requestParameters", {}).get("roleName"),
        "request_restApiId": record.get("requestParameters", {}).get("restApiId"),
        "request_resourceId": record.get("requestParameters", {}).get("resourceId"),
        "request_functionName": record.get("requestParameters", {}).get("functionName")
    }

def lambda_handler(event, context):
    today = datetime.utcnow().date()
    all_records = []

    try:
        for i in range(DAYS_TO_FETCH):
            date = today - timedelta(days=i)
            prefix = f"AWSLogs/{ACCOUNT_ID}/CloudTrail/{REGION}/{date.strftime('%Y/%m/%d')}/"
            print(f"Scanning prefix: {prefix}")
            objects = s3.list_objects_v2(Bucket=SOURCE_BUCKET, Prefix=prefix)

            if 'Contents' not in objects:
                print(f"No files found for {date}")
                continue

            for obj in objects['Contents']:
                key = obj['Key']
                if not key.endswith('.json.gz'):
                    continue
                print(f"Processing: {key}")
                try:
                    response = s3.get_object(Bucket=SOURCE_BUCKET, Key=key)
                    with gzip.GzipFile(fileobj=response['Body']) as gz:
                        data = json.loads(gz.read())
                        for record in data.get("Records", []):
                            flat = extract_fields(record)
                            all_records.append(json.dumps(flat))
                except Exception as e:
                    print(f"Failed to parse {key}: {e}")

        if not all_records:
            print("No valid records to write.")
            return {"status": "no_records"}

        output_key = "flat-last-7-days.json"
        s3.put_object(
            Bucket=DEST_BUCKET,
            Key=output_key,
            Body='\n'.join(all_records).encode('utf-8')
        )
        print(f"Written {len(all_records)} records to {output_key}")

        manifest = {
            "fileLocations": [
                {
                    "URIs": [
                        f"s3://{DEST_BUCKET}/{output_key}"
                    ]
                }
            ],
            "globalUploadSettings": {
                "format": "JSON",
                "containsHeader": "false"
            }
        }

        s3.put_object(
            Bucket=DEST_BUCKET,
            Key='manifest.json',
            Body=json.dumps(manifest).encode('utf-8'),
            ContentType='application/json'
        )
        print("manifest.json written")

        return {
            "status": "success",
            "days_fetched": DAYS_TO_FETCH,
            "records_written": len(all_records),
            "output_file": output_key
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}
