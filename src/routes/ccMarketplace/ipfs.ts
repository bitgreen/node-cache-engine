import { addFileToIpfs, assertFiles } from '../../services/ipfs';
import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
const router = express.Router();

router.post('/ipfs', async (req: Request, res: Response) => {
  console.log("IPFS, received a request")
  const files = await assertFiles(req);
  const file = files.file;
  if (Array.isArray(file)) return res.status(400).end();
  const data = await fs.readFile(file.filepath);
  const result = await addFileToIpfs(data, '');
  if (!result) return res.status(500).end();

  res.status(200).json({ cid: result.cid.toV1().toString() });
  // res.status(200).json({ cid: "result.cid.toV1().toString()" });
  res.end();
});

router.use(express.text());


router.delete('/ipfs', async (req: Request, res: Response) => {
  console.log("delete /ipfs");
  //todo: remove files from ipfs
  res.status(200).json({ isDelete: true, id: req.body});

})


export default router;
