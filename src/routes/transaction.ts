import { Account } from './../types/types';
import { Codec } from '@polkadot/types-codec/types';
import express, { Express, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { BlockHash } from '@polkadot/types/interfaces';
import { initApi } from '../services/polkadot-api';
import { GenericStorageEntryFunction } from '@polkadot/api/types';

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
router.get('/get-last-block', async (req: Request, res: Response) => {
  const val = await prisma.block.findFirst({
    where: { id: 1 },
  });
  return res.json(val);
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
      gasFees: true,
      createdAt: true,
    },
  });

  res.json({
    transaction: transaction,
  });
});

router.get('/assets/transaction', async (req: Request, res: Response) => {
  try {
    const { account } = req.query;

    const assetTransaction = await prisma.assetTransaction.findMany({
      where: {
        recipient: account as string,
      },
    });
    const assetIds = assetTransaction?.map((item) => item.assetId);
    console.log('assetIds', assetIds);
    const uniqassetIds = [...new Set(assetIds)];
    console.log('uniqassetIds', uniqassetIds);
  
    const projects = await prisma.project.findMany({
      where: {
        batchGroups: { some: { assetId: { in: uniqassetIds } } },
      },
      include: {
        registryDetails: true,
        batchGroups: { include: { batches: true } },
      },
    });
    console.log('projects', projects);
    const assetTransactions = assetTransaction.map((item) => {
      const pro = projects.find((el) =>
        el.batchGroups.some((group) => group.assetId === item.assetId)
      );
      return {
        ...item,
        assetName: pro?.name,
        nftImage: pro?.images && pro?.images.length > 0 ? pro?.images[0] : '',
      };
    });
  
    res.json(assetTransactions);
  } catch (e) {
    res.status(500).json({ error: e})
  }

});

router.get('/tokens/transaction', async (req: Request, res: Response) => {
  const { account } = req.query;

  const tokensTransaction = await prisma.tokenTransaction.findMany({
    where: {
      recipient: account as string,
    },
  });

  res.json(tokensTransaction);
});

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
