import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';
import { UserType, VerificationStatus } from '@prisma/client';
import {queryChain} from "../../../utils/chain";

const router = express.Router();

router.get('/profile', authMiddle, async (req: Request, res: Response) => {
  console.log('/profile');
  try {
    const profil = await prisma.profil.findUnique({
      where: {
        address: req.session?.address,
      },
      // include: { KYC: true },
    });

    let kycStatus = "UNVERIFIED"
    if(req.session?.address) {
      const kycData = await queryChain('kyc', 'members', [])
      for(const address of kycData.data) {
        if(address.toString() === req.session?.address) kycStatus = "VERIFIED"
      }
    }

    return res.status(200).json({
      ...profil,
      KYC: {
        "status": kycStatus,
      }
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json(e);
  }
});

router.get('/check-profile/:address', async (req: Request, res: Response) => {
  console.log('/check-profile/:address');
  try {
    const address = req.params.address;
    const profil = await prisma.profil.findUnique({
      where: {
        address: address,
      },
    });
    const isOnboarded = !!(profil?.firstName && profil?.lastName && profil?.email)
    if (!profil) return res.status(200).json({ success: false });
    return res.status(200).json({ success: true, isOnboarded: isOnboarded });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  // const auth_address = await authenticatedAddress(req);
  console.log('put /profile');
  try {
    const { profile, isLogin } = req.body;
    console.log('profile', profile, isLogin);
    const updateParams =
      isLogin == 'true'
        ? {}
        : {
            firstName: profile.firstName
              ? validator.escape(validator.trim(`${profile.firstName}`))
              : '',
            lastName: profile.lastName
              ? validator.escape(validator.trim(`${profile.lastName}`))
              : '',
            orginatorName: profile.orginatorName
              ? validator.escape(validator.trim(`${profile.orginatorName}`))
              : '',
            orginatorDescription: profile.orginatorDescription
              ? validator.escape(
                  validator.trim(`${profile.orginatorDescription}`)
                )
              : '',
            email: profile.email
              ? validator.escape(validator.trim(`${profile.email}`))
              : '',
            userType: profile.userType ? profile.userType : UserType.Individual,
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
          };
    const result = await prisma.profil.upsert({
      where: {
        address: profile.address,
      },
      update: updateParams,
      create: {
        address: profile.address,
        // KYC: {
        //   create: {
        //     status: VerificationStatus.NOT_VERIFIED,
        //   },
        // },
        email: profile.email
            ? validator.escape(validator.trim(`${profile.email}`))
            : '',
        firstName: profile.firstName
          ? validator.escape(validator.trim(`${profile.firstName}`))
          : '',
        lastName: profile.lastName
          ? validator.escape(validator.trim(`${profile.lastName}`))
          : '',
        orginatorName: profile.orginatorName
          ? validator.escape(validator.trim(`${profile.orginatorName}`))
          : '',
        orginatorDescription: profile.orginatorDescription
          ? validator.escape(validator.trim(`${profile.orginatorDescription}`))
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
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/profile-info/:address', async (req: Request, res: Response) => {
  const address = req.params.address;
  console.log('Profile');
  if (typeof address !== 'string') return res.status(400).end();

  const profil = await prisma.profil.findUnique({
    where: {
      address: address,
    },
  });
  if (profil === null)
    return res.status(404).json({ error: 'Profil not found' });

  return res.status(200).json({
    orginatorName: profil.orginatorName,
    orginatorDescription: profil.orginatorDescription,
  });
});

router.post('/save-email', authMiddle, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log('EMAIL', email);
    await prisma.profil.update({
      where: { address: req.session?.address },
      data: {
        email: email,
      },
    });
    return res.status(200);
  } catch (e) {
    res.status(500);
  }
});

export default router;
