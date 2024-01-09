import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import {authenticatedAddress} from '../../../services/authentification';
import { UserType, VerificationStatus } from '@prisma/client';
import {queryChain} from "../../../utils/chain";

const router = express.Router();

router.get('/profile', authMiddle, async (req: Request, res: Response) => {
  console.log('/profile');
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        address: req.session?.address,
      },
    });

    // TODO: Implement KYC levels
    let kycStatus = "NOT_VERIFIED"
    if(req.session?.address) {
      const kycData = await queryChain('kycPallet', 'members', [req.session?.address])

      if(kycData.data) {
        kycStatus = "VERIFIED"
      }
    }

    return res.status(200).json({
      ...profile,
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
  try {
    const address = req.params.address;
    const profile = await prisma.profile.findUnique({
      where: {
        address: address,
      },
    });
    const isOnboarded = !!(profile?.firstName && profile?.lastName && profile?.email)
    if (!profile) return res.status(200).json({ success: false });
    return res.status(200).json({ success: true, isOnboarded: isOnboarded });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.put('/profile', authMiddle, async (req: Request, res: Response) => {
  const auth_address = await authenticatedAddress(req);
  console.log('put /profile');
  try {
    const { profile, isLogin } = req.body;
    // console.log('profile', profile, isLogin);
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
            originatorName: profile.originatorName
              ? validator.escape(validator.trim(`${profile.originatorName}`))
              : '',
            originatorDescription: profile.originatorDescription
              ? validator.escape(
                  validator.trim(`${profile.originatorDescription}`)
                )
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
    const result = await prisma.profile.upsert({
      where: {
        address: auth_address,
      },
      update: updateParams,
      create: {
        address: auth_address,
        email: profile.email
            ? validator.escape(validator.trim(`${profile.email}`))
            : '',
        emailStatus: req.session?.authType === 'Google' ? 'VERIFIED' : 'NOT_VERIFIED',
        emailVerifiedAt: req.session?.authType === 'Google' ? new Date() : undefined,
        firstName: profile.firstName
          ? validator.escape(validator.trim(`${profile.firstName}`))
          : '',
        lastName: profile.lastName
          ? validator.escape(validator.trim(`${profile.lastName}`))
          : '',
        originatorName: profile.originatorName
          ? validator.escape(validator.trim(`${profile.originatorName}`))
          : '',
        originatorDescription: profile.originatorDescription
          ? validator.escape(validator.trim(`${profile.originatorDescription}`))
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

  const profile = await prisma.profile.findUnique({
    where: {
      address: address,
    },
  });
  if (profile === null)
    return res.status(404).json({ error: 'profile not found' });

  return res.status(200).json({
    originatorName: profile.originatorName,
    originatorDescription: profile.originatorDescription,
  });
});

router.post('/save-email', authMiddle, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log('EMAIL', email);
    await prisma.profile.update({
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
