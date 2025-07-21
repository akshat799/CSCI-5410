import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_YhCFqNhoE",
  tokenUse: "access",
  clientId: "4mi9pp764n686omtihftgp0b3i",
});

export const verifyToken = async (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No valid Authorization header found.");
  }

  const token = authHeader.split(" ")[1];
  return await verifier.verify(token);
};
