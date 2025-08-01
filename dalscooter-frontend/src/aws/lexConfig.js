import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { LexRuntimeV2Client } from "@aws-sdk/client-lex-runtime-v2";

// Replace with your actual values
const REGION = "us-east-1";
const IDENTITY_POOL_ID = "us-east-1:df3d537c-6aeb-4920-ba15-f3cfffe37903";

const lexClient = new LexRuntimeV2Client({
  region: REGION,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
  }),
});

export default lexClient;