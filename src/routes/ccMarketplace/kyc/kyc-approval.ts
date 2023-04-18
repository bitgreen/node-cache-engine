import express, { Request, Response } from 'express';
import { authKYC } from '../../authentification/auth-middleware';
import { submitExtrinsic } from '../../../utils/chain';

const router = express.Router();

router.post('/kyc-approval', authKYC, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    const response = await submitExtrinsic('kyc', 'addMember', [address]);
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).send();
  }
});

export default router;
