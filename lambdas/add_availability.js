import AWS from "aws-sdk";
import { verifyToken } from "./jwtVerifier.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  try {
    await verifyToken(event);
    const { scooterId, startTime, endTime, location } = JSON.parse(event.body);

    const params = {
      TableName: "Availability",
      Item: { scooterId, startTime, endTime, location },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Slot added successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
