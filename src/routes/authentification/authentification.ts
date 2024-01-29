import jwt, {JwtPayload} from 'jsonwebtoken';
import {authenticate, generateToken, isAuthSession, setCookie} from '../../services/authentification';
import express, { Express, Request, Response } from 'express';
import { authMiddle } from './auth-middleware';
const router = express.Router();
import * as Buffer from 'buffer';
import {AuthSession} from "@/types/types";

router.get('/auth', authMiddle, async (req: Request, res: Response) => {
  const decodedData = jwt.decode(req.cookies.session as string) as JwtPayload;

  return res
    .status(200)
    // .json({ authenticated: true, authType: decodedData.authType, address: decodedData.address, token: req.cookies.session });
    .json({ authenticated: true, data: decodedData });
});

router.post('/auth', async (req: Request, res: Response) => {
  if(!(await authenticate(req.body))) {
    return res
        .status(401)
        .json({ authenticated: false, error: 'Signature verification failed.' });
  }

  const payload: AuthSession = {
    authType: req.body.authType,
    message: req.body.message,
    signature: req.body.signature,
    address: req.body.address,
    proxyaddress: req.body.proxyaddress
  };

  // Generate a JWT token
  const token = generateToken(payload)

  setCookie(
    res,
    'session',
    token,
    {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      secure: process.env.NODE_ENV !== 'development',
      domain: (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN?.length > 3) ? process.env.COOKIE_DOMAIN : undefined
    }
  );

  return res.status(200).json({ authenticated: true });
});

router.post('/auth/refresh', authMiddle, async (req: Request, res: Response) => {
  const decodedData = jwt.decode(req.cookies.session as string) as JwtPayload;

  if(!(await authenticate(decodedData as AuthSession, true))) {
    return res
        .status(401)
        .json({ authenticated: false, error: 'Signature verification failed.' });
  }

  const expirationTimestamp = decodedData?.exp ? decodedData.exp * 1000 : null; // Convert to milliseconds
  const currentTime = Date.now();

  // Check if the token is about to expire within 10 minutes, and only then generate new refreshed token.
  if (expirationTimestamp && ((expirationTimestamp - currentTime) < 10 * 60 * 1000)) {
    const payload: AuthSession = {
      authType: decodedData.authType,
      message: decodedData.message,
      signature: decodedData.signature,
      address: decodedData.address,
      proxyaddress: decodedData.proxyaddress
    };

    // Refresh a JWT token
    const token = generateToken(payload)

    setCookie(
        res,
        'session',
        token,
        {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          secure: process.env.NODE_ENV !== 'development'
        }
    );
  }

  return res.status(200).json({ authenticated: true });
});

router.delete('/auth', async (req: Request, res: Response) => {
  setCookie(res, 'session', '', {
    maxAge: 0,
    path: '/',
  });

  // console.log('DELETE COOKIE');

  return res.status(200).json({ authenticated: false });
});

export default router;
