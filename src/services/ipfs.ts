import { Request } from 'express';
import formidable, { Files } from 'formidable';
import { create } from 'ipfs-http-client';
import { IPFSHTTPClient } from 'ipfs-http-client/dist/src/types';

export async function assertFiles(req: Request) {
  return new Promise<Files>((resolve, reject) => {
    formidable().parse(req, async (error, _, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

let client: IPFSHTTPClient;

export async function addFileToIpfs(data: Buffer, contentType: string) {
  if (!client) client = create({ url: process.env.IPFS_RPC_URL });
  try {
    const result = await client.add(data, {
      headers: { 'Content-Type': contentType ?? '' },
    });
    return result;
  } catch (error) {
    return undefined;
  }
}
