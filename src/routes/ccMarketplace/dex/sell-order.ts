import { initApi } from './../../../services/polkadot-api';
import { prisma } from './../../../services/prisma';

import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/sell-orders/:assetId', async (req: Request, res: Response) => {
  try {
    let assetIdParam = req.params.assetId;
    let owner = req.query.owner;
    console.log('/sell-orders/:assetId');
    console.log('owner', owner);
    const assetId = Number(assetIdParam);
    if (isNaN(assetId)) return res.status(400).json(undefined);
    const sellOrders = await prisma.sellOrder.findMany({
      where: {
        AND: [
          { assetId: assetId },
          { unitsRemain: { gt: 0 } },
          { isCancel: false },
          // {
          //   NOT: [{ owner: owner as string }],
          // },
        ],
      },
    });

    return res
      .status(200)
      .json(sellOrders.sort((a, b) => b.pricePerUnit - a.pricePerUnit));
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/sell-order', async (req: Request, res: Response) => {
  try {
    let orderIdParam = req.query.orderId;
    console.log('sell order');
    console.log(orderIdParam);
    const orderId = Number(orderIdParam);
    if (isNaN(orderId)) return res.status(400).json(undefined);
    const sellOrder = await prisma.sellOrder.findUnique({
      where: { orderId: orderId },
    });

    return res.status(200).json(sellOrder);
  } catch (e) {
    return res.status(500).json(e);
  }
});

type AmountPayment = {
  amount: number;
  orderId: number;
  quantity?: number;
  id?: string;
};

router.get('/buy-order-reserved', async (req: Request, res: Response) => {
  try {
    let { address, sellOrderIds } = req.query;
    console.log('buy-order-reserved', address, sellOrderIds);
    const api = await initApi();
    // console.log('awa', api);
    const buyOrderReserved: Array<AmountPayment> = [];
    // @ts-ignore
    const identities = await api.query.dex.buyOrders.entries();

    identities.forEach(([key, identity]) => {
      const buyOrder = key.toHuman() as Array<string>;
      const inputData = identity.toHuman() as any;
      const { buyer, totalAmount, units } = inputData;
      if (address == buyer) {
        const amount = parseFloat(
          (totalAmount as string).replace(/,/g, '').slice(0, -18)
        );
        const orderIdChain = buyOrder[0];
        const buyOrderId = Number(orderIdChain?.replace(/,/g, ''));
        buyOrderReserved.push({
          amount: amount,
          orderId: buyOrderId,
          quantity: units,
        });
      }
    });
    // const orderIds = (sellOrderIds as string)
    //   .split(',')
    //   .map((val) => Number(val));
    // console.log('orderIds', orderIds);

    // const buyOrderReserved = await prisma.buyOrderReserved.findMany({
    //   where: {
    //     AND: [{ adress: address as string }, { sellorderId: { in: orderIds } }],
    //   },
    // });

    return res.status(200).json(buyOrderReserved);
  } catch (e) {
    return res.status(500).json(e);
  }
});

export default router;
