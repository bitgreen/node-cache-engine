import express, { Express, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { BlockHash } from '@polkadot/types/interfaces';
import { initApi } from '../services/polkadot-api';

const router = express.Router();

router.get('/get-block', async (req: Request, res: Response) => {
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
});

router.get('/transactions', async (req: Request, res: Response) => {
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
});

router.get('/transaction', async (req: Request, res: Response) => {
  const { hash = '' } = req.query;

  const transaction = await prisma.transaction.findUnique({
    where: {
      hash: hash as string,
    },
    select: {
      blockNumber: true,
      hash: true,
      sender: true,
      recipient: true,
      amount: true,
      createdAt: true,
    },
  });

  res.json({
    transaction: transaction,
  });
});

router.get('/assets', async (req: Request, res: Response) => {
  const assets = await prisma.asset.findMany();

  res.json({
    assets: assets,
  });
});

router.get('/assets/transaction', async (req: Request, res: Response) => {
  const { hash = '' } = req.query;

  const transaction = await prisma.assetTransaction.findUnique({
    where: {
      hash: hash as string,
    },
  });

  res.json({
    transaction: transaction,
  });
});

router.get('/asset/balance', async (req: Request, res: Response) => {
  const { address, assetId } = req.query;

  if (address === undefined || assetId === undefined) {
    res.status(400).json({ error: 'Missing address or asset_id' });
    return;
  }

  try {
    const api = await initApi();
    const balance = await api.query.assets.account(assetId, address);
    res.json({ balance });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Invalid address or asset_id' });
    return;
  }
});

export default router;
