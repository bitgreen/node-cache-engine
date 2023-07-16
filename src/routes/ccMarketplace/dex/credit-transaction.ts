import { CreditTransactionType } from '@prisma/client';
import { initApi } from './../../../services/polkadot-api';
import { prisma } from './../../../services/prisma';

import express, { Request, Response } from 'express';

const router = express.Router();

const limit = 8;
router.get('/credit-transactions', async (req: Request, res: Response) => {
  try {
    console.log('/credit-transactions');
    const { cursor, projectId, isRetire } = req.query;
    let isDataRetire = false;
    if (isRetire) isDataRetire = isRetire == 'true';
    const cursorObj = !cursor ? undefined : { id: cursor as string };
    if (!projectId) return res.status(200).json([]);
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        AND: [
          { projectId: parseInt(projectId as string) },
          {
            type: isDataRetire
              ? CreditTransactionType.RETIRE
              : { not: CreditTransactionType.RETIRE },
          },
        ],
      },
      take: limit,
      cursor: cursorObj,
      skip: cursor === '' ? 0 : 1,
      select: {
        id: true,
        type: true,
        projectId: true,
        credits: true,
        creditPrice: true,
        createdAt: true,
      },
    });
    return res.json({
      creditTransactions: creditTransactions,
      nextId:
        creditTransactions.length === limit
          ? creditTransactions[limit - 1].id
          : undefined,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
});

export default router;
