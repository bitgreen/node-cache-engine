import { Request } from 'express';
import formidable, { Files } from 'formidable';
import axios from 'axios';
import fs from 'fs';

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

const client = axios.create({
  baseURL: `${process.env.IPFS_ENDPOINT}/add`, // base URL for the IPFS service
  headers: {
    'apikey': process.env.IPFS_API_KEY,
  },
});

export async function addFileToIpfs(file: formidable.File, contentType: string) {
  try {
    const form = new FormData();

    const bufferData = fs.readFileSync(file.filepath);

    form.append('file', new Blob([bufferData]), file.originalFilename as string);


    const response = await client.post('/add', form);

    return response.data; // return the response data from the IPFS server
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    return undefined;
  }
}
