# -----------------------
# add_availability
# -----------------------
resource "aws_iam_policy" "add_availability_policy" {
  name = "AddAvailabilityPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem"],
      Resource = aws_dynamodb_table.availability.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "add_availability_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.add_availability_policy.arn
}

# -----------------------
# book_slot
# -----------------------
resource "aws_iam_policy" "book_slot_policy" {
  name = "BookSlotPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:PutItem"],
        Resource = aws_dynamodb_table.bookings.arn
      },
      {
        Effect   = "Allow",
        Action   = ["dynamodb:GetItem"],
        Resource = aws_dynamodb_table.availability.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "book_slot_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.book_slot_policy.arn
}

# -----------------------
# cancel_booking
# -----------------------
resource "aws_iam_policy" "cancel_booking_policy" {
  name = "CancelBookingPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:UpdateItem"],
      Resource = aws_dynamodb_table.bookings.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cancel_booking_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.cancel_booking_policy.arn
}

# -----------------------
# get_availability
# -----------------------
resource "aws_iam_policy" "get_availability_policy" {
  name = "GetAvailabilityPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:Scan", "dynamodb:GetItem"],
      Resource = aws_dynamodb_table.availability.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_availability_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.get_availability_policy.arn
}

# -----------------------
# get_bookings
# -----------------------
resource "aws_iam_policy" "get_bookings_policy" {
  name = "GetBookingsPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:Scan", "dynamodb:GetItem"],
      Resource = aws_dynamodb_table.bookings.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "get_bookings_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.get_bookings_policy.arn
}

# -----------------------
# update_availability
# -----------------------
resource "aws_iam_policy" "update_availability_policy" {
  name = "UpdateAvailabilityPolicy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"],
      Resource = aws_dynamodb_table.availability.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "update_availability_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.update_availability_policy.arn
}
