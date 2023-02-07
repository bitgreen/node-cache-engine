import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';

const router = express.Router();

router.get('/profile', authMiddle, async (req: Request, res: Response) => {
  const profil = await prisma.profil.findUnique({
    where: {
      address: req.session?.address,
    },
  });
  return res.status(200).json(profil);
});

router.put('/profile', async (req: Request, res: Response) => {
  // const auth_address = await authenticatedAddress(req);
  const {profile, isLogin} = req.body;
  console.log("prfil body", profile);
  console.log("isLogin body", isLogin);
  const updateParams = isLogin ? {} :  {
    firstName: profile.firstName
      ? validator.escape(validator.trim(`${profile.firstName}`))
      : '',
    lastName: profile.lastName
      ? validator.escape(validator.trim(`${profile.lastName}`))
      : '',
    // avatar: profile.avatar, // TODO: temp disabled
    activityTransactionReceipts: profile.activityTransactionReceipts
      ? validator.toBoolean(`${profile.activityTransactionReceipts}`)
      : false,
    activityOffersFilled: profile.activityOffersFilled
      ? validator.toBoolean(`${profile.activityOffersFilled}`)
      : false,
    marketingNews: profile.activityOffersFilled
      ? validator.toBoolean(`${profile.marketingNews}`)
      : false,
  }
  const result = await prisma.profil.upsert({
    where: {
      address: profile.address,
    },
    update:updateParams,
    create: {
      address:  profile.address,
      firstName: profile.firstName
        ? validator.escape(validator.trim(`${profile.firstName}`))
        : '',
      lastName: profile.lastName
        ? validator.escape(validator.trim(`${profile.lastName}`))
        : '',
      // avatar: profile.avatar, // TODO: temp disabled
      activityTransactionReceipts: profile.activityTransactionReceipts
        ? validator.toBoolean(`${profile.activityTransactionReceipts}`)
        : false,
      activityOffersFilled: profile.activityOffersFilled
        ? validator.toBoolean(`${profile.activityOffersFilled}`)
        : false,
      marketingNews: profile.activityOffersFilled
        ? validator.toBoolean(`${profile.marketingNews}`)
        : false,
    },
  });

  return res.status(200).json(result);
});

router.get('/profile/:address', async (req: Request, res: Response) => {
  const address = req.params.address;
  console.log("Profile");
  if (typeof address !== 'string') return res.status(400).end();

  const profil = await prisma.profil.findUnique({
    where: {
      address: address,
    },
  });
  if (profil === null)
    return res.status(404).json({ error: 'Profil not found' });

  return res.status(200).json(profil);
});

export default router;
