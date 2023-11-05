import { Account } from './../types/types';
import { Codec } from '@polkadot/types-codec/types';
import express, { Express, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { BlockHash } from '@polkadot/types/interfaces';
import { initApi } from '../services/polkadot-api';
import { GenericStorageEntryFunction } from '@polkadot/api/types';

const router = express.Router();

router.get('/get-block', async (req: Request, res: Response) => {
  console.log('/get-block');
  try {
    let block_number = req.query.block_number as string;

    const api = await initApi();

    const block_hash = (await api.rpc.chain.getBlockHash(
      block_number
    )) as BlockHash;

    let [signed_block, block_events] = await Promise.all([
      api.rpc.chain.getBlock(block_hash),
      api.query.system.events.at(block_hash),
    ]);

    res.json({
      signed_block: signed_block.toHuman(),
      block_events: block_events.toHuman(),
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});
router.get('/get-last-block', async (req: Request, res: Response) => {
  try {
    const blocks = await prisma.block.findMany({
      select: {
        number: true
      },
      orderBy: {
        number: 'desc'
      }
    });

    const lastBlock = blocks[0].number
    const totalBlocksFetched = blocks.length
    const syncedPercentage = (totalBlocksFetched / lastBlock * 100).toFixed(2)

    return res.json({
      syncedPercentage,
      totalBlocksFetched,
      lastBlock
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});
router.get('/transactions', async (req: Request, res: Response) => {
  console.log('/transactions');

  try {
    const {
      account,
      dateStart = '2000-01-01',
      dateEnd = '2200-01-01',
    } = req.query;

    const account_query = account
      ? {
          OR: [{ sender: account as string }, { recipient: account as string }],
        }
      : {};

    let transactions;
    try {
      transactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: new Date(dateStart as string),
            lte: new Date(dateEnd as string),
          },
          ...account_query,
        },
        select: {
          blockNumber: true,
          hash: true,
          sender: true,
          recipient: true,
          amount: true,
          gasFees: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (e) {
      transactions = null;
    }

    res.json({
      transactions: transactions,
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/transaction', async (req: Request, res: Response) => {
  console.log('/transaction');
  try {
    const { hash = '' } = req.query;
    if (!hash)
      return res.json({
        transaction: [],
      });
    const transaction = await prisma.transaction.findMany({
      where: {
        hash: {
          contains: hash as string,
        },
      },
    });
    res.json({
      transaction: transaction,
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/asset/transactions', async (req: Request, res: Response) => {
  console.log('/asset/transactions');
  try {
    const { account, assetId, take } = req.query;
    const aId = !isNaN(Number(assetId)) ? Number(assetId) : undefined;
    const assetTransactions = await prisma.assetTransaction.findMany({
      where: {
        AND: [
          {
            OR: [
              { recipient: account as string },
              { sender: account as string },
            ],
          },
          { assetId: aId },
        ],
      },
      take: !isNaN(Number(take)) ? Number(take) : undefined,
    });

    res.json(assetTransactions);
  } catch (e) {
    res.status(500).json(e);
  }
});

router.get('/carboncredits/transactions', async (req: Request, res: Response) => {
  console.log('/carboncredits/transactions');
  try {
    const { account, assetId, take } = req.query;
    const aId = !isNaN(Number(assetId)) ? Number(assetId) : undefined;
    const assetTransactions = await prisma.carbonCreditAssetTransaction.findMany({
      where: {
        AND: [
          {
            OR: [
              { to: account as string },
              { from: account as string },
            ],
          },
          { projectId: aId },
        ],
      },
      take: !isNaN(Number(take)) ? Number(take) : undefined,
    });

    res.json(assetTransactions);
  } catch (e) {
    res.status(500).json(e);
  }
});

router.get('/token/transactions', async (req: Request, res: Response) => {
  console.log('/token/transactions');
  try {
    const { account, take } = req.query;

    const tokensTransactions = await prisma.tokenTransaction.findMany({
      where: {
        OR: [{ recipient: account as string }, { sender: account as string }],
      },
      take: !isNaN(Number(take)) ? Number(take) : undefined,
    });

    res.json(tokensTransactions);
  } catch (e) {
    res.status(500).json(e);
  }
});
router.get(
  '/tokens-assets/ids',
  async (req: Request, res: Response) => {
    console.log('/tokens-assets/ids');
    try {
      const { account } = req.query;
      const [tokens, assets] = await prisma.$transaction([
        prisma.tokenTransaction.findMany({
          where: {
            OR: [
              { recipient: account as string },
              { sender: account as string },
            ],
          },
          select: {
            tokenId: true
          }
        }),
        prisma.assetTransaction.findMany({
          where: {
            OR: [
              { recipient: account as string },
              { sender: account as string },
            ],
          },
          select: {
            assetId: true
          }
        }),
      ]);
      const uniqeAssetIds = [...new Set(assets.map((tk) => tk.assetId).filter(assetId => {
        return assetId || assetId === 0
      }))];
      const uniqeTokenIds = [...new Set(tokens.map((tk) => tk.tokenId).filter(Boolean))];

      res.json({
        assets: uniqeAssetIds, 
        tokens: uniqeTokenIds
      }
      );
    } catch (e) {
      res.status(500).json(e);
    }
  }
);

router.get('/balance', async (req: Request, res: Response) => {
  const { address, assetId } = req.query;

  if (address === undefined || assetId === undefined) {
    res.status(400).json({ error: 'Missing address or asset_id' });
    return;
  }

  try {
    const api = await initApi();
    const account = await api.query.system.account(address);
    const { data } = account.toHuman() as unknown as Account;
    res.json(data.free);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Invalid address or asset_id' });
    return;
  }
});

router.get('/account', async (req: Request, res: Response) => {
  const { address, assetId } = req.query;

  if (address === undefined || assetId === undefined) {
    res.status(400).json({ error: 'Missing address or asset_id' });
    return;
  }

  try {
    const api = await initApi();
    const account = await api.query.system.account(address);
    const accountBalance = account.toHuman();
    res.json({ accountBalance });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Invalid address or asset_id' });
    return;
  }
});

export default router;
