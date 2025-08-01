import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'S3_BUCKET'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read all Logins data
source = glueContext.create_dynamic_frame.from_options(
    format_options={"jsonPath": "$[*].item"},
    connection_type="s3",
    format="json",
    connection_options={
        "paths": [f"s3://{args['S3_BUCKET']}/logins/AWSDynamoDB/data/"],
        "recurse": True
    }
)

# Standardize schema
transformed = ApplyMapping.apply(
    frame=source,
    mappings=[
        ("login_id.S", "string", "login_id", "string"),
        ("user_id.S", "string", "user_id", "string"),
        ("login_timestamp.S", "string", "login_timestamp", "string"),
        ("email.S", "string", "email", "string"),
        ("event_type.S", "string", "event_type", "string"),
        ("logout_timestamp.S", "string", "logout_timestamp", "string")
    ]
)

# Write to new table
glueContext.write_dynamic_frame.from_options(
    frame=transformed,
    connection_type="s3",
    format="glueparquet",
    connection_options={
        "path": f"s3://{args['S3_BUCKET']}/logins/processed/",
        "partitionKeys": []
    },
    transformation_ctx="sink"
)

job.commit()