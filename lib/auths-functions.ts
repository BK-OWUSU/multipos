import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { NextResponse } from "next/server";
// import jwtVerify2 from "jose"
import {jwtVerify, decodeJwt, errors, SignJWT} from "jose"
import { EmailVerificationPayload, JwtPayload, PosPayload} from "@/types/auth/auth";
import { cookies } from "next/headers";
const POS_COOKIE_NAME = "pos_token";
const VERIFY_COOKIE_NAME = "verify_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";
const POS_CASH_SESSION_NAME = "pos__cash_session_token"

// For hashing passwords, 
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}
//For password verification,
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password,hashedPassword)
}

// For JWT token generation the POS,
export function generatePOSToken (payload: JwtPayload): string  {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRETE is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "3d"}) //Expires in 3 days
}


//FOR EMAIL VERIFICATION TOKEN
export function generateEmailVerificationToken(payload: EmailVerificationPayload): string {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRETE is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "10m"}) //Expires in 10 minutes
}

// For JWT token generation the POS Cash Session,
export function generatePOSCashSessionToken (payload: PosPayload): string  {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "12h"}) //Expires in 1 days
}

// This is only used in API routes, NOT in middleware
export function verifyPOSToken(token: string): JwtPayload | null {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const decode = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decode; // Return the actual payload object
    } catch (error) {
        console.log("Error verifying token: ", error)
        return null;
    }
}


// This is only used in API routes, NOT in middleware
export function verifyPOSCashSessionToken(token: string): PosPayload | null {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const decode = jwt.verify(token, JWT_SECRET) as PosPayload;
        return decode; // Return the actual payload object
    } catch (error) {
        console.log("Error verifying token: ", error)
        return null;
    }
}


//for middleware token verification, jose is needed 
export async function verifyPOSTokenEdge(token: string): Promise<{payload: JwtPayload, isExpired: boolean} | null> {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
         if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const secrete = new TextEncoder().encode(JWT_SECRET);
        const {payload} = await jwtVerify(token, secrete)
        return {payload: payload as JwtPayload, isExpired: false };
    } catch (error: unknown) {
        console.log("Error verifying token: ", error)
        // Check if the error is due to token expiration
        // Safe type guard using jose's built-in JWTExpired class
        if (error instanceof errors.JWTExpired) {
            try {
                const decoded = decodeJwt(token) as JwtPayload;
                return { payload: decoded, isExpired: true };
            } catch (decodeError) {
                console.log("Error decoding expired token: ", decodeError);
                return null;
            }
        }
        return null;
    }
}


// Utility function to get session in API routes
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(POS_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPOSToken(token) as JwtPayload;
}

export async function getPOSCashSession(): Promise<PosPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(POS_CASH_SESSION_NAME)?.value;
  if (!token) return null;
  return verifyPOSCashSessionToken(token) as PosPayload;
}


export function verifyEmailVerificationToken(token: string): EmailVerificationPayload | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string, purpose?: string};
  } catch (error) {
    console.log("Verify token error:", error);
    return null;
  }
}






//Attaches the signed  TOKENS into HttpOnly cookies on a response object.

//MAIN APP SESSION UPDATER
//TODO: TO BE DELETED AND REPLACED BY FUNCTION UNDER IT
export async function updateSessionShop(newShopId: string, newShopSlug: string): Promise<boolean> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!
    const cookieStore = await cookies();
    const existingCookie = cookieStore.get(POS_COOKIE_NAME);
    if (!existingCookie || !existingCookie.value) return false; 
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRETE is not defined");
    }
    const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

    // 1. Decode current valid token payload data context
    // Swap this step out with standard jwt.verify() if using jsonwebtoken package dependencies instead
    const { payload } = await jwtVerify(existingCookie.value, SECRET_KEY) as { payload: JwtPayload };


    // 2. Splice in the updated shop branch coordinates
     if (!newShopId || !newShopSlug) {
      throw new Error("New ShopID and ShopSlug are not defined");
    }
    
    const updatedPayload: JwtPayload = {
      ...payload,
      shopId: newShopId,
      shopSlug: newShopSlug
    };
  

    // 3. Re-sign a brand new token containing the updated parameters
    const newToken = await new SignJWT(updatedPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30m") // Match your 30 minutes rule parameters window
      .sign(SECRET_KEY);

    // 4. Overwrite cookie directly from within the NextJS server action boundary runtime context
    cookieStore.set(POS_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60,
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("FAILED_TO_UPDATE_SESSION_COOKIE:", error);
    return false;
  }
}

// MAIN APP SESSION UPDATER
export async function updateSessionPayload(updates: Partial<JwtPayload>): Promise<boolean> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const cookieStore = await cookies();
    const existingCookie = cookieStore.get(POS_COOKIE_NAME);
    if (!existingCookie || !existingCookie.value) return false; 
    
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

    // 1. Decode current valid token payload data context
    const { payload } = await jwtVerify(existingCookie.value, SECRET_KEY) as { payload: JwtPayload };

    // 2. Validate that update fields are provided
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("No update parameters were provided");
    }
    
    // 3. Merge old payload with any dynamic fields provided
    const updatedPayload: JwtPayload = {
      ...payload,
      ...updates
    };
  
    // 4. Re-sign a brand new token containing the updated parameters
    const newToken = await new SignJWT(updatedPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30m") // Match your 30 minutes rule parameters window
      .sign(SECRET_KEY);

    // 5. Overwrite cookie directly from within the NextJS server action boundary runtime context
    cookieStore.set(POS_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60,
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("FAILED_TO_UPDATE_SESSION_COOKIE:", error);
    return false;
  }
}


//SET MAIN POS APP TOKEN FOR LOGIN
export function setPOSAppSessionCookie(response: NextResponse, payload: JwtPayload): void {
  const token = generatePOSToken(payload);
  response.cookies.set(POS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60, // 30 minutes
    path: "/", // Ensures access across all sibling nested api/page layers
  });
}

//SET EMAIL VERIFICATION TOKEN 
export function setEmailVerificationSessionCookie(response: NextResponse, payload: EmailVerificationPayload): void {
  const token = generateEmailVerificationToken(payload);
  response.cookies.set(VERIFY_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60, // 30 minutes
    path: "/", // Ensures access across all sibling nested api/page layers
  });
}


//EMAIL PASSWORD RESET TOKEN 
export function setPasswordResetSessionCookie(response: NextResponse, payload: EmailVerificationPayload): void {
  const token = generateEmailVerificationToken(payload);
  response.cookies.set(PASSWORD_RESET_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60, // 10 minutes
    path: "/", // Ensures access across all sibling nested api/page layers
  });
}


//CASH REGISTER
export function setPOSCashSessionCookie(response: NextResponse, payload: PosPayload): void {
  const token = generatePOSCashSessionToken(payload);
  
  response.cookies.set(POS_CASH_SESSION_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60, // 12 Hours (matches your JWT expiration window precisely)
    path: "/", // Ensures access across all sibling nested api/page layers
  });
}


//CLEARING TOKENS
 //Evicts the session token completely from the client browser cache drawer.

 //MAIN POS APP
export function clearPOSAppSessionCookie(response: NextResponse): void {
  response.cookies.set(POS_COOKIE_NAME, "",{
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, 
    path: "/", 
  });
}


//EMAIL VERIFICATION TOKEN CLEARING
export function clearEmailVerificationSessionCookie(response: NextResponse): void {
  response.cookies.set(VERIFY_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0), 
    maxAge: 0,
    path: "/", 
  });
}


//PASSWORD RESET TOKEN CLEARING 
export function clearPasswordResetSessionCookie(response: NextResponse): void {
  response.cookies.set(PASSWORD_RESET_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0), 
    path: "/",
    maxAge: 0 
  });
}


//CASH REGISTER
export function clearPOSCashSessionCookie(response: NextResponse): void {
  response.cookies.set(POS_CASH_SESSION_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, 
    path: "/",
  });
}

export { POS_COOKIE_NAME, VERIFY_COOKIE_NAME,PASSWORD_RESET_COOKIE_NAME, POS_CASH_SESSION_NAME };