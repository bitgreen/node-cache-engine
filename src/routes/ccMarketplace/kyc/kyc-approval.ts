import express, { Request, Response } from 'express';
import { authKYC } from '../../authentification/auth-middleware';
import { submitExtrinsic } from '../../../utils/chain';
import { prisma } from '../../../services/prisma';
import { VerificationStatus } from '@prisma/client';
import * as crypto from 'crypto';
const router = express.Router();

router.post('/kyc-approval', authKYC, async (req: Request, res: Response) => {
  try {
    //const { address } = req.body;
    const { address } = req.body;
    const response = await submitExtrinsic('kyc', 'addMember', [address]);
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).send();
  }
});
router.post('/kyc-test', authKYC, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    console.log('address', address);
    await prisma.profil.update({
      where: { address: address },
      data: {
        KYC: {
          update: {
            status: VerificationStatus.VERIFIED,
          },
        },
      },
    });
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send();
  }
});
router.post('/kyc-remove', authKYC, async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    const response = await submitExtrinsic('kyc', 'removeMember', [address]);
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).send();
  }
});

router.post('/webhook/kyc-approval', async (req: Request, res: Response) => {
  try {
    //const { address } = req.body;
    const { type, data, wallet_substrate_address } = req.body;
    console.log('body', req.body);
    const signature =
      'sha1=' +
      crypto
        .createHmac('sha1', process.env.FRACTAL_WEBHOOK_SECRET ?? '')
        .update(Buffer.from(JSON.stringify(req.body)))
        .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(req.headers['x-fractal-signature'] as string),
        Buffer.from(signature)
      )
    ) {
      return res.status(400).send({ status: false });
    }
    // const { wallet_substrate_address } = req.body;
    if (type != 'verification_approved')
      return res.status(400).send({ status: false });

    const response = await submitExtrinsic('kyc', 'addMember', [
      wallet_substrate_address,
    ]);
    // await prisma.profil.update({
    //   where: {address: wallet_substrate_address},
    //   data: {
    //     KYC: {
    //       create: {
    //         status: VerificationStatus.VERIFIED
    //       }

    //     }

    //   }
    // })
    return res.status(200).send({ status: true });
  } catch (err) {
    return res.status(500).send();
  }
});

router.post('/webhook/kyc-rejected', async (req: Request, res: Response) => {
  try {
    console.log('body', req.body);
    //const { address } = req.body;
    const { type, data, wallet_substrate_address } = req.body;

    const signature =
      'sha1=' +
      crypto
        .createHmac('sha1', process.env.FRACTAL_WEBHOOK_SECRET ?? '')
        .update(Buffer.from(JSON.stringify(req.body)))
        .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(req.headers['x-fractal-signature'] as string),
        Buffer.from(signature)
      )
    ) {
      return res.status(400).send({ status: false });
    }
    // const { wallet_substrate_address } = req.body;
    if (type != 'verification_rejected')
      return res.status(400).send({ status: false });

    await prisma.profil.update({
      where: { address: wallet_substrate_address },
      data: {
        KYC: {
          create: {
            status: VerificationStatus.REJECTED,
          },
        },
      },
    });
    return res.status(200).send();
  } catch (err) {
    return res.status(500).send();
  }
});

export default router;
