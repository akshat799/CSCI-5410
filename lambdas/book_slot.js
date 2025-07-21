import AWS from "aws-sdk";
import { verifyToken } from "./jwtVerifier.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  try {
    const payload = await verifyToken(event);
    const userId = payload.sub;

    const { scooterId, startTime } = JSON.parse(event.body);
    const params = {
      TableName: "Bookings",
      Item: {
        userId,
        scooterId,
        startTime,
      },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Slot booked successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
