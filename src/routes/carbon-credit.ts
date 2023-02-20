import express, { Express, Request, Response } from 'express';
import { prisma } from '../services/prisma';
const router = express.Router();

// router.get('/carbon-credits/owned', async (req: Request, res: Response) => {
//   const address = req.query.address;
//   const asset_id = Number(req.query.asset_id);

//   if (typeof address !== 'string') {
//     res.status(400).json({ error: 'Invalid address' });
//     return;
//   }

//   if (req.query.asset_id !== undefined && isNaN(asset_id)) {
//     res.status(400).json({ error: 'Invalid asset ID' });
//     return;
//   }

//   const received = await prisma.assetTransaction.groupBy({
//     by: ['recipient', 'assetId'],
//     where: {
//       recipient: address,
//       ...(asset_id && { asset_id: asset_id }),
//     },
//     _sum: {
//       amount: true,
//     },
//   });

//   const sent = await prisma.assetTransaction.groupBy({
//     by: ['sender', 'assetId'],
//     where: {
//       sender: address,
//       ...(asset_id && { asset_id: asset_id }),
//     },
//     _sum: {
//       amount: true,
//     },
//   });

//   const owned = received
//     .map((r) => {
//       const s = sent.find((s) => s.assetId === r.assetId);

//       return {
//         asset_id: r.assetId,
//         amount: (r?._sum?.amount ?? 0) - (s?._sum?.amount ?? 0),
//       };
//     })
//     .filter((o) => o.amount > 0);

//   res.json({ owned });
// });

export default router;
