resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "analytics_bucket" {
  bucket = "dalscooter-dynamodb-exports-${data.aws_caller_identity.current.account_id}-${random_id.bucket_suffix.hex}"
}

resource "aws_glue_catalog_database" "analytics_db" {
  name = "dalscooter_analytics"
}

resource "aws_iam_role" "glue_crawler_role" {
  name = "glue-crawler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "glue.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "glue_crawler_policy" {
  name = "GlueCrawlerPolicy"
  role = aws_iam_role.glue_crawler_role.id

  depends_on = [aws_iam_role.glue_crawler_role]

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.analytics_bucket.arn}",
          "${aws_s3_bucket.analytics_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "glue:*",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ],
        Resource = [
          "${data.aws_dynamodb_table.logins.arn}",
          "${data.aws_dynamodb_table.logins.arn}/stream/*"
        ]
      }
    ]
  })
}

resource "aws_glue_crawler" "users_crawler" {
  name          = "users-crawler"
  role          = aws_iam_role.glue_crawler_role.arn
  database_name = aws_glue_catalog_database.analytics_db.name
  table_prefix  = "users_"

  s3_target {
    path = "s3://${aws_s3_bucket.analytics_bucket.bucket}/users/"
  }

  schedule = "cron(10 * * * ? *)"
}

resource "aws_glue_crawler" "logins_crawler" {
  name          = "logins-crawler"
  role          = aws_iam_role.glue_crawler_role.arn
  database_name = aws_glue_catalog_database.analytics_db.name
  table_prefix  = "logins_"

  s3_target {
    path = "s3://${aws_s3_bucket.analytics_bucket.bucket}/logins/"
  }

  schedule = "cron(10 * * * ? *)"
}

output "analytics_s3_bucket_name" {
  value = aws_s3_bucket.analytics_bucket.bucket
}

output "glue_database_name" {
  value = aws_glue_catalog_database.analytics_db.name
}