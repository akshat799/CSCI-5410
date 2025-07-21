import AWS from "aws-sdk";
import { verifyToken } from "./jwtVerifier.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  try {
    await verifyToken(event);

    const scooterId = event.queryStringParameters?.scooterId;
    const params = {
      TableName: "Availability",
      KeyConditionExpression: "scooterId = :s",
      ExpressionAttributeValues: { ":s": scooterId },
    };

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
