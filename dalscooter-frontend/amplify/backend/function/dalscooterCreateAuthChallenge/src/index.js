const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const session = event.request.session || [];
  const username = event.userName;

  if (session.length === 0) {
    // Step 1: Fetch security question
    try {
      const result = await ddb.get({
        TableName: 'SecurityQA',
        Key: { username },
      }).promise();

      const question = result.Item?.question || 'What is your favorite color?';
      const answer = result.Item?.answer || 'blue';

      event.response.publicChallengeParameters = { question };
      event.response.privateChallengeParameters = { answer };
      event.response.challengeMetadata = 'SECURITY_QUESTION';
    } catch (err) {
      console.error('DynamoDB Fetch Error:', err);
      throw err;
    }
  } else if (session.length === 1 && session[0].challengeResult === true) {
    // Step 2: Show Caesar cipher
    event.response.publicChallengeParameters = {
      question: 'Decrypt this Caesar Cipher (Shift 3): fdhvdu',
    };
    event.response.privateChallengeParameters = { answer: 'caesar' };
    event.response.challengeMetadata = 'CAESAR_CIPHER';
  }

  return event;
};
