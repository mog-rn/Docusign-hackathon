import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function checkAuthStatus(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("authToken")?.value;
  
  if (!token) {
    console.debug("Auth check failed: No token found");
    return false;
  }

  const tokenParts = token.split('.');
  console.log("JWT Header:", JSON.parse(atob(tokenParts[0])));
  console.log("JWT Payload:", JSON.parse(atob(tokenParts[1])));

  // Try different secret encoding approaches
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Configuration error: JWT_SECRET not set");
      return false;
    }

    // Approach 1: Direct encoding of the secret
    const encodedSecret1 = new TextEncoder().encode(secret);
    console.log("Encoded secret length 1:", encodedSecret1.length);

    // Approach 2: Handle special characters
    const decodedSecret = decodeURIComponent(secret);
    const encodedSecret2 = new TextEncoder().encode(decodedSecret);
    console.log("Encoded secret length 2:", encodedSecret2.length);

    try {
      const { payload } = await jwtVerify(token, encodedSecret1);
      console.log("Verification succeeded with approach 1");
      return true;
    } catch (error1) {
      console.log("Approach 1 failed, trying approach 2");
      try {
        const { payload } = await jwtVerify(token, encodedSecret2);
        console.log("Verification succeeded with approach 2");
        return true;
      } catch (error2) {
        throw error2;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`JWT Verification Failed - ${error.name}: ${error.message}`);
      console.debug("Auth check failed: Invalid signature");
    }
    return false;
  }
}