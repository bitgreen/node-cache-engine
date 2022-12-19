import { isWalletSession, setCookie } from '../../services/authentification';
import express, { Express, Request, Response } from 'express';
import { authMiddle } from './auth-middleware';
const router = express.Router();

router.get('/auth', authMiddle, async (req: Request, res: Response) => {
  return res
    .status(200)
    .json({ authenticated: true, address: req.session?.address });
});

router.post('/auth', async (req: Request, res: Response) => {
  if (!isWalletSession(req.body)) {
    return res
      .status(401)
      .json({ authenticated: false, error: 'Invalid request.' });
  }
  setCookie(
    res,
    'session',
    JSON.stringify({
      message: req.body.message,
      signature: req.body.signature,
      address: req.body.address,
    }),
    {
      httpOnly: false,
      maxAge: 60 * 60 * 8,
      sameSite: 'strict',
      path: '/',
      secure: process.env.NODE_ENV !== 'development',
    }
  );
  console.log('Auth sucess');
  return res.status(200).json({ authenticated: true });
});
export default router;
