import { WalletSession } from './../types/types';
import express, { Request, Response } from 'express';
import { hexToU8a, stringToU8a, u8aToHex } from '@polkadot/util';
import {
  cryptoWaitReady,
  decodeAddress,
  signatureVerify,
} from '@polkadot/util-crypto';
import { serialize } from 'cookie';

export async function authenticatedAddress(req: Request) {
  const session = req.cookies.session ? JSON.parse(req.cookies.session) : '';
  const address = await authenticate(session);
  return address ? address : '';
}

export async function authenticate(session: WalletSession) {
  if (!session) return undefined;
  // Make sure all fields are there.
  if (!isWalletSession(session)) return undefined;
  const currentTimestamp = new Date().getTime();

  // Extract timestamp and domain from a message.
  const message = session.message.split('#');
  const timestamp = parseInt(message[0]);
  // Signature expiration time.
  if (currentTimestamp - timestamp > 8 * 60 * 60 * 1000) return undefined;
  try {
    // Some interfaces, such as using sr25519 are only available via WASM.
    await cryptoWaitReady();
    if (
      signatureVerify(
        stringToU8a(session.message),
        hexToU8a(session.signature),
        u8aToHex(decodeAddress(session.address))
      ).isValid
    )
      return session.address;
  } catch (error) {
    return undefined;
  }
}

export function isWalletSession(data: WalletSession): data is WalletSession {
  return (
    typeof data.message === 'string' &&
    typeof data.signature === 'string' &&
    typeof data.address === 'string'
  );
}

export function setCookie(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: any,
  name: string,
  value: string,
  options: Record<string, unknown> = {}
): void {
  const stringValue =
    typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value);
  res.cookie(name, stringValue, options);
  // res.setHeader('Set-Cookie', serialize(name, String(stringValue), options));
}
