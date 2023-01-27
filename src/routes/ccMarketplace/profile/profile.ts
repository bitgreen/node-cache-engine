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
  const profil = req.body;
  console.log("prfil body", profil);
  const result = await prisma.profil.upsert({
    where: {
      address: profil.address,
    },
    update: {
      firstName: profil.firstName
        ? validator.escape(validator.trim(`${profil.firstName}`))
        : '',
      lastName: profil.lastName
        ? validator.escape(validator.trim(`${profil.lastName}`))
        : '',
      // avatar: profil.avatar, // TODO: temp disabled
      activityTransactionReceipts: profil.activityTransactionReceipts
        ? validator.toBoolean(`${profil.activityTransactionReceipts}`)
        : false,
      activityOffersFilled: profil.activityOffersFilled
        ? validator.toBoolean(`${profil.activityOffersFilled}`)
        : false,
      marketingNews: profil.activityOffersFilled
        ? validator.toBoolean(`${profil.marketingNews}`)
        : false,
    },
    create: {
      address:  profil.address,
      firstName: profil.firstName
        ? validator.escape(validator.trim(`${profil.firstName}`))
        : '',
      lastName: profil.lastName
        ? validator.escape(validator.trim(`${profil.lastName}`))
        : '',
      // avatar: profil.avatar, // TODO: temp disabled
      activityTransactionReceipts: profil.activityTransactionReceipts
        ? validator.toBoolean(`${profil.activityTransactionReceipts}`)
        : false,
      activityOffersFilled: profil.activityOffersFilled
        ? validator.toBoolean(`${profil.activityOffersFilled}`)
        : false,
      marketingNews: profil.activityOffersFilled
        ? validator.toBoolean(`${profil.marketingNews}`)
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
