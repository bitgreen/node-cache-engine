import { Request } from 'express';
import formidable, { Files } from 'formidable';
import { create } from 'ipfs-http-client';

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

const client = create({ url: process.env.INFURA_API_ENDPOINT });

const headers = {
  Authorization: `Basic ${btoa(process.env.INFURA_PROJECT_ID + ":" + process.env.INFURA_API_KEY)}`,
}

export async function addFileToIpfs(data: Buffer, contentType: string) {
  try {
    return await client.add(data, {
      headers: {
        ...headers,
        'Content-Type': contentType ?? ''
      },
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
