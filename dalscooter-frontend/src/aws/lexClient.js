import AWS from 'aws-sdk';

// Set region
AWS.config.region = 'us-east-1';

// Configure credentials using Cognito Identity Pool
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:df3d537c-6aeb-4920-ba15-f3cfffe37903',  // your pool ID
});

// Initialize Lex runtime client
const lexRuntime = new AWS.LexRuntimeV2();

export default lexRuntime;
