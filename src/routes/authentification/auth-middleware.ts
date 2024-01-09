import {AuthSession} from '@/types/types';
import { Request, Response, NextFunction } from 'express';
import jwt, {JwtPayload} from "jsonwebtoken";
import Buffer from "buffer";

declare global {
  namespace Express {
    export interface Request {
      session?: AuthSession;
    }
  }
}

export async function authMiddle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.cookies.session) {
    return res
      .status(401)
      .json({ success: false, authenticated: false, error: 'Invalid token.' });
  }

  try {
    jwt.verify(req.cookies.session, Buffer.Buffer.from(process.env.JWT_SECRET_KEY || '').toString('base64'), (err: any, data: any) => {
      if (err) {
        return res.status(403).json({ message: 'Token verification failed.' });
      }

      req.session = data as AuthSession

      next(); // Proceed to the next middleware or route
    });
  } catch (e) {
    return res
        .status(401)
        .json({ success: false, authenticated: false, error: 'Something went wrong' });
  }
}

export async function authKYC(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  // hashing password
  if (!header || header !== process.env.PASSWORD_KYC) {
    return res
      .status(401)
      .json({ authenticated: false, error: 'Not authenticated' });
  }

  next();
}
