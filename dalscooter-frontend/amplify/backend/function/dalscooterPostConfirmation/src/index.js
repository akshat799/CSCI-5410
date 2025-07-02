const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider();
const ddb = new AWS.DynamoDB.DocumentClient();

const USER_POOL_ID = process.env.USER_POOL_ID;
const GROUP_NAME = 'RegisteredCustomers'; // default group

exports.handler = async (event, context) => {
  const { userName, request } = event;
  const email = request.userAttributes.email;
  const question = request.clientMetadata?.question;
  const answer = request.clientMetadata?.answer;

  const username = userName;

  console.log('Storing MFA security data in DynamoDB...');
  try {
    await ddb.put({
      TableName: 'SecurityQA',
      Item: {
        username,
        question,
        answer,
      },
    }).promise();
    console.log('Stored MFA data');
  } catch (error) {
    console.error('Error storing to DynamoDB:', error);
  }

  console.log('Adding user to group...');
  try {
    await cognito.adminAddUserToGroup({
      GroupName: GROUP_NAME,
      UserPoolId: USER_POOL_ID,
      Username: username,
    }).promise();
    console.log(`Added user to group: ${GROUP_NAME}`);
  } catch (error) {
    console.error('Error adding user to group:', error);
  }

  return event;
};
