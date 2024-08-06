import axios from 'axios';
import * as uritemplate from 'uri-template';
import {queryChain, submitExtrinsic} from "@/utils/chain";
import logger from "@/utils/logger";

interface FractalUser {
  uid: string;
  emails: { address: string }[];
  institution: string;
  verification_cases: {
    level: string,
    status: string
  }[],
  person: {
    date_of_birth: string;
    full_name: string;
    liveness: boolean;
    residential_address_country: string;
    identification_document_number: string;
    identification_document_country: string;
    identification_document_date_of_expiry: string;
    identification_document_date_of_issue: string;
    identification_document_front_file: string;
    identification_document_type: string;
  };
  wallets: {
    address: string;
    currency: string;
    created_at: string;
    updated_at: string;
  }[];
}

interface FractalToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export const loginTemplate = uritemplate.parse(
    `${process.env.FRACTAL_FRONTEND_SERVER}/authorize{?client_id,redirect_uri,response_type,scope,state,ensure_wallet}`,
);

const tokenTemplate = uritemplate.parse(
  `${process.env.FRACTAL_AUTH_SERVER}/oauth/token{?client_id,client_secret,code,grant_type,redirect_uri}`
);

// if you have a fractal access token, you can use this function to get user information
// see here: https://docs.developer.fractal.id/user-integration/user-information-retrieval
export async function getUserInformation(
  accessToken: string
): Promise<FractalUser> {
  const result = await axios.get<FractalUser>(
    `${process.env.FRACTAL_RESOURCE_SERVER}/users/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (result) {
    return result.data;
  }

  throw new Error('Error getting user information');
}

// if you have a fractal code, you can use this function to get an access token
// see here: https://docs.developer.fractal.id/user-integration/user-authorization#obtaining-an-access-token
export async function getAccessToken(code: string): Promise<FractalToken> {
  const res = await axios.post<FractalToken>(
    tokenTemplate.expand({
      client_id: process.env.FRACTAL_CLIENT_ID,
      client_secret: process.env.FRACTAL_SECRET,
      redirect_uri: process.env.FRACTAL_REDIRECT_URL,
      code: code,
      grant_type: 'authorization_code',
    })
  );

  if (res.status !== 200 || !res) throw new Error('Error getting access token');

  return res.data;
}

export async function kycOnChain(address: string, newLevel: number) {
  const existingData = await queryChain('kycPallet', 'members', [address])

  const match = existingData?.data?.toString().match(/KYCLevel(\d+)/);
  const existingLevel = match ? Number(match[1]) : 0;

  // skip in some cases
  if(newLevel < 1) {
    logger.info('Not verified. Skipping address.')
    return
  }
  if(newLevel === 1 && existingLevel >= 1) {
    logger.info('User is already level1 KYC. Skipping address.')
    return
  }
  if(existingLevel === 4) {
    logger.info('User is already level4 KYC. Skipping address.')
    return
  }

  const call = existingLevel >= 1 ? 'modifyMember' : 'addMember'

  // no need to do this in db since this is done by blockchain event listener later
  const response = await submitExtrinsic('kycPallet', call, [address, `KYCLevel${newLevel}`]);

  if(response.success) {
    logger.info(`Address ${address} successfully KYCed to level ${newLevel}.`)
  } else {
    logger.error(`Failed to KYC address ${address}. ${response.error}`)
  }
}