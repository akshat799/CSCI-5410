import AWS from "aws-sdk";
import { verifyToken } from "./jwtVerifier.js";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  try {
    await verifyToken(event);

    const { scooterId, startTime, endTime, location } = JSON.parse(event.body);
    const params = {
      TableName: "Availability",
      Key: { scooterId, startTime },
      UpdateExpression: "set endTime = :e, location = :l",
      ExpressionAttributeValues: {
        ":e": endTime,
        ":l": location,
      },
    };

    await dynamodb.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Slot updated successfully" }),
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
