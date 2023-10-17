import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';
import BigNumber from "bignumber.js";

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
  const trades = await prisma.trade.findMany({
    select: {
      creditPrice: true,
      sellOrder: {
        select: {
          assetId: true,
        }
      }
    }
  });

  const creditPriceAggregation: aggregatedPrice[] = [];

  for (const trade of trades) {
    const assetId = trade.sellOrder.assetId;
    if (!creditPriceAggregation[assetId]) {
      creditPriceAggregation[assetId] = {
        totalCreditPrice: new BigNumber(0),
        tradeCount: 0
      };
    }

    creditPriceAggregation[assetId].totalCreditPrice = creditPriceAggregation[assetId].totalCreditPrice.plus(new BigNumber(trade.creditPrice));
    creditPriceAggregation[assetId].tradeCount += 1;
  }

  // Calculate the average creditPrice for each assetId.
  const averageCreditPrices: averagePrice[] = [];

  for (const assetId in creditPriceAggregation) {
    averageCreditPrices[assetId] = {
      assetId: parseInt(assetId),
      price: parseFloat(creditPriceAggregation[assetId].totalCreditPrice.dividedBy(creditPriceAggregation[assetId].tradeCount).dividedBy(new BigNumber(10).pow(18)).toFixed(2))
    };
  }

  return res.status(200).json(averageCreditPrices);
})

export default router;