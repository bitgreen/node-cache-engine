import { authenticate } from '../../services/authentification';
import { AuthSession } from '@/types/types';
import { Request, Response, NextFunction } from 'express';

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
  // console.log("cookies", req.cookies.session)
  if (!req.cookies.session) {
    return res
      .status(401)
      .json({ success: false, authenticated: false, error: 'Token verification failed.' });
  }

  try {
    const session = JSON.parse(req.cookies.session) as AuthSession;

    if (!(await authenticate(session))) {
      return res
          .status(401)
          .json({ success: false, authenticated: false, error: 'Token verification failed.' });
    }
    req.session = session;
    next();
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
