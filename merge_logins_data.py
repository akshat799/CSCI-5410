import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql.functions import col

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

# Convert to DataFrame for deduplication
df = source.toDF()

# Flatten schema
df_flattened = df.select(
    col("login_id.S").alias("login_id"),
    col("user_id.S").alias("user_id"),
    col("login_timestamp.S").alias("login_timestamp"),
    col("email.S").alias("email"),
    col("event_type.S").alias("event_type"),
    col("logout_timestamp.S").alias("logout_timestamp")
)

# Deduplicate based on login_id
df_deduped = df_flattened.dropDuplicates(["login_id"])

# Convert back to DynamicFrame
transformed = DynamicFrame.fromDF(df_deduped, glueContext, "transformed")

# Write to Parquet
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