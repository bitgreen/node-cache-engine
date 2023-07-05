import axios from 'axios';
import * as uritemplate from 'uri-template';

interface FractalUser {
  uid: string;
  emails: { address: string }[];
  institution: string;
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

const tokenTemplate = uritemplate.parse(
  `https://auth.fractal.id/oauth/token{?client_id,client_secret,code,grant_type,redirect_uri}`
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
