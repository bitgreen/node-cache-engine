import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { UserType, VerificationStatus } from '@prisma/client';
import {queryChain} from "../../../utils/chain";
import {sendActivationEmail} from "@/services/resend";
import jwt from "jsonwebtoken";
import Buffer from "buffer";
import {AuthSession} from "@/types/types";

const router = express.Router();

router.get('/profile', authMiddle, async (req: Request, res: Response) => {
  console.log('/profile');
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        address: req.session?.address,
      },
    });

    const kyc = {
      status: "NOT_VERIFIED",
      level: 0
    }

    if(req.session?.address) {
      const kycData = await queryChain('kycPallet', 'members', [req.session?.address])

      if(kycData.data) {
        const kycLevel = parseInt(kycData.data.match(/\d+/)[0]);

        kyc.status = "VERIFIED"
        kyc.level = kycLevel
      }
    }

    return res.status(200).json({
      ...profile,
      kyc
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
  console.log('put /profile');
  try {
    const { profile, isLogin } = req.body;
    console.log('profile', profile, isLogin);

    const profileDb = await prisma.profile.findUnique({
      where: {
        address: req.session?.address
      },
    });

    const email = profile.email
        ? validator.escape(validator.trim(`${profile.email}`))
        : undefined
    const emailChanged = email !== profileDb?.email

    const updateParams: any =
      isLogin == 'true'
        ? {}
        : {
            firstName: profile.firstName
              ? validator.escape(validator.trim(`${profile.firstName}`))
              : '',
            lastName: profile.lastName
              ? validator.escape(validator.trim(`${profile.lastName}`))
              : '',
            email: email,
            originatorName: profile.originatorName
              ? validator.escape(validator.trim(`${profile.originatorName}`))
              : '',
            originatorDescription: profile.originatorDescription
              ? validator.escape(
                  validator.trim(`${profile.originatorDescription}`)
                )
              : '',
            userType: profile.userType ? profile.userType : UserType.Individual,
            termsAccepted: profile?.termsAccepted,
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

    if(emailChanged) {
      updateParams.emailStatus = 'NOT_VERIFIED'
      updateParams.emailVerifiedAt = undefined
    }

    const result = await prisma.profile.upsert({
      where: {
        address: req.session?.address,
      },
      update: updateParams,
      create: {
        address: req.session?.address as string,
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
        userType: profile.userType ? profile.userType : UserType.Individual,
        termsAccepted: profile?.termsAccepted,
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

    if(emailChanged && req.session?.authType !== 'Google') {
      // send email confirmation
      sendActivationEmail({
        address: profile.address,
        email: profile.email,
        name: `${profile.firstName} ${profile.lastName}`
      })
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json(err);
  }
});

router.get('/profile-info/:address', async (req: Request, res: Response) => {
  const address = req.params.address;
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

router.post('/profile/save-email', authMiddle, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if(!email) return res.status(202).json({ success: false, message: 'Please provide valid email.' });

    const profileDb = await prisma.profile.findUnique({
      where: {
        address: req.session?.address
      },
    });

    if(!profileDb || profileDb?.email?.toLowerCase() === email.toLowerCase()) {
      return res.status(202).json({ success: false, message: 'Please provide new email.' });
    }

    await prisma.profile.update({
      where: { address: req.session?.address },
      data: {
        email: email,
        emailStatus: 'NOT_VERIFIED'
      },
    });

    if(req.session?.authType !== 'Google') {
      // send email confirmation
      sendActivationEmail({
        address: profileDb.address,
        email: email,
        name: `${profileDb.firstName} ${profileDb.lastName}`
      })
    }

    return res.status(200).json({ success: true, message: 'Successfully changed email!' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error occurred.' });
  }
});

router.post('/profile/verify-email', authMiddle, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    jwt.verify(token, Buffer.Buffer.from(process.env.JWT_SECRET_KEY || '').toString('base64'), async(err: any, data: any) => {
      if (err) {
        return res.status(403).json({ message: 'Token verification failed.' });
      }

      const profileDb = await prisma.profile.findUnique({
        where: {
          address: req.session?.address
        },
      });

      if(profileDb?.email?.toLowerCase() !== data?.email?.toLowerCase()) {
        return res.status(403).json({ message: 'Token verification failed.' });
      }

      await prisma.profile.update({
        where: { address: data?.address },
        data: {
          emailStatus: 'VERIFIED',
        },
      });
    });

    return res.status(200);
  } catch (e) {
    res.status(500);
  }
});

export default router;
