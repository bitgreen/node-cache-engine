import express, { Request, Response } from 'express';
import { authKYC } from '../../authentification/auth-middleware';
import { submitExtrinsic } from '../../../utils/chain';
import { prisma } from '../../../services/prisma';
import { VerificationStatus } from '@prisma/client';

const router = express.Router();

// router.post('/kyc-approval', authKYC, async (req: Request, res: Response) => {
//   try {
//     //const { address } = req.body;
//     const { address } = req.body;
//     const response = await submitExtrinsic('kyc', 'addMember', [address]);
//     return res.status(200).json(response);
//   } catch (err) {
//     return res.status(500).send();
//   }
// });
router.post('/webhook/kyc-approval', async (req: Request, res: Response) => {
  try {
    //const { address } = req.body;
    const { wallet_substrate_address } = req.body;
    const response = await submitExtrinsic('kyc', 'addMember', [wallet_substrate_address]);
    await prisma.profil.update({
      where: {address: wallet_substrate_address}, 
      data: {
        KYC: {
          create: {
            status: VerificationStatus.VERIFIED
          }
          
        }

      }
    })
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).send();
  }
});

export default router;
