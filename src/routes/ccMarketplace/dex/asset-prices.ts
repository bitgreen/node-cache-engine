import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';
import BigNumber from "bignumber.js";
import {AssetTransactionType} from "@prisma/client";

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
      type: AssetTransactionType.TRADED,
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
    return prisma.assetTransaction.findMany({
      where: {
        assetId: assetId,
        type: AssetTransactionType.TRADED
      },
      orderBy: {
        blockNumber: 'desc',
      },
      select: {
        amount: true,
        pricePerUnit: true
      },
      take: 10, // Take the last 10 trades
    }).then((trades) => {
      if (!trades.length) {
        return { assetId, averagePrice: '0', totalVolume: '0' }; // Return '0' if there are no trades
      }
      let totalVolume = new BigNumber(0);
      let totalPriceVolume = new BigNumber(0);

      trades.forEach((trade) => {
        const tradePrice = new BigNumber(trade.pricePerUnit || 0);
        const tradeVolume = trade.amount;

        // Calculate total volume and total price volume
        totalVolume = totalVolume.plus(tradeVolume);
        totalPriceVolume = totalPriceVolume.plus(tradePrice.multipliedBy(tradeVolume));
      });

      // Calculate volume-weighted average price
      const averagePrice = totalPriceVolume.dividedBy(totalVolume).dividedBy(new BigNumber(10).pow(18));

      return {
        assetId,
        price: averagePrice.toFixed(2)
      };
    });
  });

  const averages = await Promise.all(averagePricePromises);

  return res.status(200).json(averages);
})

export default router;