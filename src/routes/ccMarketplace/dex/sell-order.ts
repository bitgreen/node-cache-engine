import { prisma } from './../../../services/prisma';

import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/sell-orders/:assetId', async (req: Request, res: Response) => {
    let assetIdParam = req.params.assetId;
    console.log("sell order")
    console.log(assetIdParam)
    const assetId = Number(assetIdParam)
    if (isNaN(assetId)) return res.status(400).json(undefined)
    const sellOrders = await prisma.sellOrder.findMany(
        { where: { 
            AND: [
                {assetId: assetId},
                {isSold:false}
            ]
         }
     });

    return res.status(200).json(sellOrders);
});

export default router;