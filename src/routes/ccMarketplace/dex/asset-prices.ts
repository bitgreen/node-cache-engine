import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import BigNumber from "bignumber.js";
import {AssetTransactionType} from "@prisma/client";
import {getAssetPrice} from "@/services/exchangeRate";

const router = express.Router();

interface aggregatedPrice {
  totalCreditPrice: BigNumber;
  tradeCount: number;
}

interface averagePrice {
  assetId: number;
  price: number;
}

router.get('/asset-prices', async (req: Request, res: Response) => {
  const uniqueAssetIds = await prisma.assetTransaction.findMany({
    where: {
      type: AssetTransactionType.SOLD,
      assetId: {
        not: null,
      },
    },
    distinct: ['assetId'],
    select: {
      assetId: true,
    },
  });

  const averagePricePromises = uniqueAssetIds.map(({ assetId }) => {
    return assetId ? getAssetPrice(assetId) : null
  });

  const averages = await Promise.all(averagePricePromises);

  return res.status(200).json(averages);
})

export default router;