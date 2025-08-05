import boto3
import json
import os
from datetime import datetime
from decimal import Decimal


def get_attr_val(attr):
    """Extract actual value from DynamoDB attribute format"""
    if isinstance(attr, dict):
        if 'S' in attr: 
            return attr['S']
        if 'N' in attr: 
            return float(attr['N'])
        if 'BOOL' in attr:  
            return bool(attr['BOOL'])
    return attr


def lambda_handler(event, context):
    try:
        print("Starting analytics aggregation...")
        
        dynamodb = boto3.resource('dynamodb')
        s3 = boto3.client('s3')
        
        bucket = os.environ.get('S3_BUCKET_NAME')
        users_table = os.environ.get('USERS_TABLE_NAME', 'Users')
        feedback_table = os.environ.get('FEEDBACK_TABLE_NAME', 'CustomerFeedback')
        bikes_table = os.environ.get('BIKES_TABLE_NAME', 'Bikes')
        
        users = scan_table_paginated(dynamodb, users_table, process_user_item)
        feedback = scan_table_paginated(dynamodb, feedback_table, process_feedback_item)
        bikes = scan_table_paginated(dynamodb, bikes_table, process_bike_item)
        
        # CREATE COMBINED DATASET FOR QUICKSIGHT
        combined_data = []
        
        # Add Users
        for u in users:
            combined_data.append({
                "record_type": "user",
                "user_id": u.get('user_id'),
                "email": u.get('email'),
                "role": u.get('role'),
                "created_at": u.get('created_at'),
                "bike_id": None,
                "rating": None,
                "sentiment": None,
                "scooter_type": None,
                "status": None,
                "hourly_rate": None,
                "location": None
            })
        
        # Add Feedback
        for fb in feedback:
            combined_data.append({
                "record_type": "feedback",
                "user_id": fb.get('customer_id'),
                "email": None,
                "role": None,
                "created_at": fb.get('created_at'),
                "bike_id": fb.get('bike_id'),
                "rating": fb.get('rating'),
                "sentiment": fb.get('sentiment'),
                "scooter_type": None,
                "status": None,
                "hourly_rate": None,
                "location": None
            })
        
        # Add Bikes
        for b in bikes:
            combined_data.append({
                "record_type": "bike",
                "user_id": None,
                "email": None,
                "role": None,
                "created_at": b.get('created_at'),
                "bike_id": b.get('bike_id'),
                "rating": None,
                "sentiment": None,
                "scooter_type": b.get('scooter_type'),
                "status": b.get('status'),
                "hourly_rate": b.get('hourly_rate'),
                "location": b.get('location')
            })
        
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_users": len(users),
            "total_feedback": len(feedback),
            "total_bikes": len(bikes),
            "users_by_role": count_by_field(users, 'role'),
            "bikes_by_type": count_by_field(bikes, 'scooter_type'),
            "bikes_by_status": count_by_field(bikes, 'status'),
            "feedback_by_sentiment": count_by_field(feedback, 'sentiment'),
            "average_rating": calculate_average_rating(feedback),
            "rating_distribution": get_rating_distribution(feedback)
        }
        
        timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')
        
        # Upload individual files (keep existing)
        upload_to_s3(s3, bucket, f'analytics/users-{timestamp}.json', users)
        upload_to_s3(s3, bucket, f'analytics/feedback-{timestamp}.json', feedback)
        upload_to_s3(s3, bucket, f'analytics/bikes-{timestamp}.json', bikes)
        upload_to_s3(s3, bucket, f'analytics/summary-{timestamp}.json', summary)
        
        # Upload combined dataset for QuickSight
        combined_key = f'analytics/combined-{timestamp}.json'
        upload_to_s3(s3, bucket, combined_key, combined_data)
        
        manifest = {
            "fileLocations": [
                {"URIs": [f"s3://{bucket}/{combined_key}"]}
            ],
            "globalUploadSettings": {"format": "JSON"}
        }
        
        manifest_key = "analytics/manifest.json"
        s3.put_object(
            Bucket=bucket,
            Key=manifest_key,
            Body=json.dumps(manifest),
            ContentType="application/json"
        )
        print(f"Uploaded manifest file to {manifest_key}")
        
        print("Aggregation completed successfully")
        
        return {
            "statusCode": 200, 
            "body": json.dumps({
                "message": "Aggregation and manifest uploaded successfully",
                "timestamp": timestamp,
                "combined_file": combined_key,
                "manifest_file": manifest_key
            }, default=decimal_default)
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}


def scan_table_paginated(dynamodb, table_name, processor, limit=100):
    try:
        table = dynamodb.Table(table_name)
        items = []
        kwargs = {"Limit": limit}
        while True:
            response = table.scan(**kwargs)
            for item in response.get("Items", []):
                items.append(processor(item))
            if "LastEvaluatedKey" not in response:
                break
            kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        return items
    except Exception as e:
        print(f"Scan error on {table_name}: {e}")
        return []


def process_user_item(item):
    return {
        "user_id": get_attr_val(item.get("user_id", "unknown")),
        "email": get_attr_val(item.get("email", "unknown")),
        "role": get_attr_val(item.get("role", "unknown")),
        "created_at": get_attr_val(item.get("created_at", datetime.utcnow().isoformat()))
    }


def process_feedback_item(item):
    return {
        "feedback_id": get_attr_val(item.get("feedback_id", "unknown")),
        "bike_id": get_attr_val(item.get("bike_id", "unknown")),
        "customer_id": get_attr_val(item.get("customer_id", "unknown")),
        "rating": get_attr_val(item.get("rating", 0)),
        "sentiment": get_attr_val(item.get("sentiment", "NEUTRAL")),
        "created_at": get_attr_val(item.get("created_at", datetime.utcnow().isoformat()))
    }


def process_bike_item(item):
    return {
        "bike_id": get_attr_val(item.get("bike_id", "unknown")),
        "scooter_type": get_attr_val(item.get("bike_type", item.get("scooter_type", "unknown"))),
        "status": get_attr_val(item.get("status", "unknown")),
        "hourly_rate": get_attr_val(item.get("hourly_rate", 0)),
        "location": get_attr_val(item.get("location", "unknown")),
        "created_at": get_attr_val(item.get("created_at", datetime.utcnow().isoformat()))
    }


def count_by_field(data, field):
    counts = {}
    for d in data:
        v = d.get(field, "unknown")
        counts[v] = counts.get(v, 0) + 1
    return counts


def calculate_average_rating(data):
    if not data:
        return 0
    total = sum(d.get("rating", 0) for d in data)
    return round(total / len(data), 2)


def get_rating_distribution(data):
    dist = {str(i): 0 for i in range(1, 6)}
    for d in data:
        r = str(int(d.get("rating", 0)))
        if r in dist:
            dist[r] += 1
    return dist


def upload_to_s3(s3, bucket, key, data):
    try:
        s3.put_object(Bucket=bucket, Key=key, Body=json.dumps(data, default=decimal_default), ContentType="application/json")
        print(f"Uploaded {key}")
    except Exception as e:
        print(f"S3 upload error: {e}")


def decimal_default(o):
    if isinstance(o, Decimal):
        return float(o)
    raise TypeError(f"Unsupported type: {type(o)}")