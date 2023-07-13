import { VerificationStatus } from '@prisma/client';
import * as crypto from 'crypto';
import express, { Request, Response } from 'express';
import { prisma } from '../../../services/prisma';
import { submitExtrinsic } from '../../../utils/chain';
import {getAccessToken, getUserInformation, loginTemplate} from '../../../utils/fractal';
import { authKYC } from '../../authentification/auth-middleware';

const router = express.Router();

router.get('/kyc/start', async (req: Request, res: Response) => {
  let scope = process.env.FRACTAL_BASIC_SCOPE;
  const { address, state, type } = req.query;

  if(type === 'advanced') {
    scope = process.env.FRACTAL_ADVANCED_SCOPE;
  }

  res.status(200).json({
    url: loginTemplate.expand({
      client_id: process.env.FRACTAL_CLIENT_ID,
      redirect_uri: process.env.FRACTAL_REDIRECT_URL,
      response_type: "code",
      scope: scope,
      state: state,
      ensure_wallet: address
    })
  });
})

router.get('/kyc/callback', async (req: Request, res: Response) => {
  try {
    // step 1: get access token from given code
    const { code, state } = req.query
    const { access_token } = await getAccessToken(code as string);

    // step 2: get user information from fractal api
    const user = await getUserInformation(access_token);

    console.log(user.wallets)

    // await prisma.KYC.create({
    //   where: {
    //     profilAddress: user.wallets[0].address, // we only ask for one wallet address in fractal
    //   },
    //   create: {
    //     profilAddress: user.wallets[0].address
    //     FractalId: user.uid,
    //     status: VerificationStatus.PENDING,
    //     FirstName: user.person.full_name.split(' ').slice(0, -1).join(' '),
    //     Country: user.person.residential_address_country
    //         .split(' ')
    //         .slice(-1)
    //         .join(' '),
    //   },
    //   update: {
    //     profilAddress: user.wallets[0].address
    //     status: VerificationStatus.PENDING,
    //     FirstName: user.person.full_name.split(' ').slice(0, -1).join(' '),
    //     Country: user.person.residential_address_country
    //         .split(' ')
    //         .slice(-1)
    //         .join(' '),
    //   }
    // });

    if(state === 'carbon') {
      return res.redirect(`https://carbon.bitgreen.org/onboarding/callback?code=${code}`);
    } else {
      return res.redirect(`https://bitgreen.org`);
    }
  } catch (err: any) {
    console.log('error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
})

// this webhook is called by fractal when a user is approved
// the body contains the user_id of the user that was approved, which matches with the FractalId in the KYC table
// we use this to find the profile entry in the DB and update the KYC status to VERIFIED
router.post('/webhook/kyc-approval', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    const signature =
      'sha1=' +
      crypto
        .createHmac(
          'sha1',
          process.env.FRACTAL_WEBHOOK_SECRET_VERIFICATION_APPROVED ?? ''
        )
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
    if (type !== 'verification_approved') {
      return res.status(400).send({ status: false });
    }

    const { user_id } = data;

    console.log('data')
    console.log(data)

    const all_kyc = await prisma.KYC.findMany({
      where: {
        FractalId: user_id
      },
    });

    if (!all_kyc.length)
      return res
          .status(400)
          .json({ status: false, message: 'KYC profile not found.' });

    all_kyc.map((kyc) => {
      console.log('kyc')
      console.log(kyc)

      // save on blockchain
      // no need to do this in db since this is done by blockchain event listener later
      // await submitExtrinsic('kyc', 'addMember', [kyc.profilAddress]);
    })

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// this webhook is called by fractal when a user is rejected
// the body contains the user_id of the user that was rejected, which matches with the FractalId in the KYC table
// we use this to find the profile entry in the DB and update the KYC status to REJECTED
router.post('/webhook/kyc-rejected', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

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
      return res.status(400).send({ success: false });
    }
    if (type != 'verification_rejected') {
      return res.status(400).send({ success: false });
    }

    const { user_id } = data;

    // find profile entry in DB
    const profile = await prisma.profil.findFirst({
      where: {
        KYC: {
          FractalId: user_id,
        },
      },
    });

    // save on blockchain
    // no need to do this in db since this is done by blockchain event listener later
    if (!profile)
      return res
        .status(400)
        .json({ success: false, message: 'Profile not found' });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// this endpoint gets a fractal-generated code from the frontend, uses it to get user information from the fractal api, and then saves it to the database
router.post('/kyc-save-user', async (req: Request, res: Response) => {
  try {
    // step 1: get access token from given code
    const { code } = req.body;
    const { access_token } = await getAccessToken(code);

    // step 2: get user information from fractal api
    const user = await getUserInformation(access_token);

    // step 3: save user information to database
    await prisma.profil.update({
      where: {
        address: user.wallets[0].address, // we only ask for one wallet address in fractal
      },
      data: {
        KYC: {
          create: {
            FractalId: user.uid,
            status: VerificationStatus.PENDING,
            FirstName: user.person.full_name.split(' ').slice(0, -1).join(' '),
            Country: user.person.residential_address_country
              .split(' ')
              .slice(-1)
              .join(' '),
          },
        },
      },
    });

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    console.log('error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
