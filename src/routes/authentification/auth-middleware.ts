import { authenticate } from '../../services/authentification';
import { WalletSession } from '@/types/types';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    export interface Request {
      session?: WalletSession;
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
      .json({ authenticated: false, error: 'Token verification failed.' });
  }
  const session = JSON.parse(req.cookies.session) as WalletSession;

  if (!(await authenticate(session))) {
    return res
      .status(401)
      .json({ authenticated: false, error: 'Token verification failed.' });
  }
  req.session = session;
  next();
}
