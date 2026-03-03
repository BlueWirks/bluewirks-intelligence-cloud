import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Verifies Firebase ID token from Authorization header.
 * Attaches userId, orgId, and role to the request.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await getAuth().verifyIdToken(token);
    (req as any).userId = decoded.uid;
    (req as any).orgId = decoded.org_id;
    (req as any).role = decoded.role;
    next();
  } catch (err) {
    console.error("Auth verification failed", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
