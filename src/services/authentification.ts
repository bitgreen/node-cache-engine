import {AuthSession} from './../types/types';
import express, { Request, Response } from 'express';
import { hexToU8a, stringToU8a, u8aToHex } from '@polkadot/util';
import {
  cryptoWaitReady,
  decodeAddress,
  signatureVerify,
  keccakAsHex
} from '@polkadot/util-crypto';
import { serialize } from 'cookie';
import {queryChain} from "../utils/chain";
import jwt, {JwtPayload} from "jsonwebtoken";
import Buffer from "buffer";

export async function authenticate(session: AuthSession, extendToken?: boolean): Promise<boolean> {
  // Make sure all fields are there.
  if (!session || !isAuthSession(session)) return false;

  // Extract timestamp and data from a message.
  const message = session.message.split('#');
  const timestamp = parseInt(message[0]);

  const currentTimestamp = new Date().getTime();

  // Wallet signature for generation of the init token is valid only for short period of time.
  if (!extendToken && currentTimestamp - timestamp > 60 * 1000) return false;

  // Wallet signature is valid for max 24h
  if(currentTimestamp - timestamp > 24 * 60 * 60 * 1000) return false

  try {
    // Some interfaces, such as using sr25519 are only available via WASM.
    await cryptoWaitReady();

    const signer = session.proxyaddress || session.address

    if(session.proxyaddress) {
      const email = message[1];

      // query chain to get proxy address
      const proxy = await queryChain('generalStorage', 'storedData', [
        '5EhJWJYo3V7nozjNDrA4G6s4XqAFaPXpVYjFhVL9qVF5QxSw', // TX relay acc
        keccakAsHex(email)
      ])

      const proxyData = proxy.data.split('#')
      if(session.address != proxyData[0] || session.proxyaddress != proxyData[1]) {
        return false
      }
    }

    return signatureVerify(
        stringToU8a(session.message),
        hexToU8a(session.signature),
        u8aToHex(decodeAddress(signer))
    ).isValid
  } catch (error) {
    return false;
  }
}

export function isAuthSession(data: AuthSession): data is AuthSession {
  return (!!data.message &&
    !!data.signature &&
    !!data.address
  );
}

export function setCookie(
  res: Response,
  name: string,
  value: string,
  options: Record<string, unknown> = {}
): void {
  const stringValue =
    typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value);
  res.cookie(name, stringValue, {
    ...options,
    secure: process.env.NODE_ENV !== 'development',
    domain: (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN?.length > 3) ? process.env.COOKIE_DOMAIN : undefined
  });
  // res.setHeader('Set-Cookie', serialize(name, String(stringValue), options));
}

export function generateToken(payload: AuthSession) {
  // Refresh a JWT token
  return jwt.sign(
      payload,
      Buffer.Buffer.from(process.env.JWT_SECRET_KEY || '').toString('base64'),
      {
        expiresIn: '30m'
      }
  );
}