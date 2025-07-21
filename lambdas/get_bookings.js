import AWS from "aws-sdk";
import { verifyToken } from "./jwtVerifier.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  try {
    const payload = await verifyToken(event);
    const userId = payload.sub;

    const params = {
      TableName: "Bookings",
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
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
