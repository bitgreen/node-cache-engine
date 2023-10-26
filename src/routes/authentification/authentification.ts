import { isAuthSession, setCookie } from '../../services/authentification';
import express, { Express, Request, Response } from 'express';
import { authMiddle } from './auth-middleware';
const router = express.Router();

router.get('/auth', authMiddle, async (req: Request, res: Response) => {
  return res
    .status(200)
    .json({ authenticated: true, authType: req.session?.authType, address: req.session?.address });
});

router.post('/auth', async (req: Request, res: Response) => {
  // console.log('mutate');
  if (!isAuthSession(req.body)) {
    return res
      .status(401)
      .json({ authenticated: false, error: 'Invalid request.' });
  }
  setCookie(
    res,
    'session',
    JSON.stringify({
      authType: req.body.authType,
      message: req.body.message,
      signature: req.body.signature,
      address: req.body.address,
      proxyaddress: req.body.proxyaddress
    }),
    {
      httpOnly: true, //false
      maxAge: 60 * 1000 * 60 * 8,
      //expire:  1 / 24,
      sameSite: 'strict',
      path: '/',
      secure: false, //process.env.NODE_ENV !== 'development',
    }
  );
  return res.status(200).json({ authenticated: true });
});

router.delete('/auth', async (req: Request, res: Response) => {
  setCookie(res, 'session', '', {
    maxAge: 0,
    path: '/',
  });
  console.log('DELETE COOKIE');
  return res.status(200).json({ authenticated: false });
});

export default router;
