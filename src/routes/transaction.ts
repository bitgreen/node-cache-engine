import { Account } from './../types/types';
import { Codec } from '@polkadot/types-codec/types';
import express, { Express, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { BlockHash } from '@polkadot/types/interfaces';
import { initApi } from '../services/polkadot-api';
import { GenericStorageEntryFunction } from '@polkadot/api/types';
import {createAssetTransactionFilter, createTransactionFilter} from "../utils/filters";
import {AssetTransactionType, Batch} from "@prisma/client";
import {getAssetPrice} from "@/services/exchangeRate";

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
      // @ts-ignore
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

    const lastBlock = blocks[0]?.number
    const totalBlocksFetched = blocks.length
    const syncedPercentage = (totalBlocksFetched / (lastBlock || 0) * 100).toFixed(2)

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
      page = 1,
      pageSize = 10
    } = req.query;

    const { dateFilter, sortFilter, paginationFilter } = await createTransactionFilter(req);

    const whereQuery = {
      AND: [
        { ...dateFilter },
      ],
      OR: [
        { from: account as string },
        { to: account as string },
      ]
    }

    const totalRecords = await prisma.transaction.count({
      where: whereQuery,
      orderBy: sortFilter,
    });

    const totalPages = Math.ceil(totalRecords / Number(pageSize));

    const transactions = await prisma.transaction.findMany({
      where: whereQuery,
      orderBy: sortFilter,
      select: {
        blockNumber: true,
        hash: true,
        from: true,
        to: true,
        amount: true,
        gasFees: true,
        createdAt: true,
      },
    });

    res.json({
      transactions: transactions,
      totalRecords: totalRecords,
      totalPages: totalPages
    });
  } catch (e) {
    console.log(e)
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
  try {
    const {
      account,
      page = 1,
      pageSize = 10
    } = req.query;

    const { projectIdFilter, assetIdFilter, transactionTypeFilter, sortFilter } = await createAssetTransactionFilter(req);
    const { dateFilter, paginationFilter } = await createTransactionFilter(req);

    const whereQuery = {
      owner: account as string,
      AND: [
        { ...projectIdFilter },
        { ...assetIdFilter },
        { ...dateFilter },
        { ...transactionTypeFilter },
      ]
    }

    const totalRecords = await prisma.assetTransaction.count({
      where: whereQuery,
      orderBy: sortFilter,
    });

    const totalPages = Math.ceil(totalRecords / Number(pageSize));

    const assetTransactions = await prisma.assetTransaction.findMany({
      where: whereQuery,
      orderBy: sortFilter,
      include: {
        batchGroup: {
          select: {
            assetId: true,
            type: true,
            project: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        }
      },
      ...paginationFilter(totalRecords, Number(pageSize), Number(page))
    });

    // Manually transform the data to rename the property
    const transformedAssetTransactions = assetTransactions.map((item) => {
      const { batchGroup, ...rest } = item;
      return {
        ...rest,
        info: {
          projectId: batchGroup?.project?.id,
          projectName: batchGroup?.project?.name,
          projectImage: batchGroup?.project?.images[0] || null,
          assetId: batchGroup?.assetId,
          type: batchGroup?.type,
        },
      };
    });

    res.json({
      transactions: transformedAssetTransactions,
      totalRecords: totalRecords,
      totalPages: totalPages
    });
  } catch (e: any) {
    // console.log(e)
    res.status(500).json(e.message);
  }
});

router.get('/token/transactions', async (req: Request, res: Response) => {
  console.log('/token/transactions');
  try {
    const { account, take } = req.query;

    const tokensTransactions = await prisma.tokenTransaction.findMany({
      where: {
        OR: [{ from: account as string }, { to: account as string }],
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
      const { account, includeInfo } = req.query;
      const [tokens, assets] = await prisma.$transaction([
        prisma.tokenTransaction.findMany({
          where: {
            OR: [
              { from: account as string },
              { to: account as string },
            ],
          },
          select: {
            tokenId: true
          }
        }),
        prisma.assetTransaction.findMany({
          where: {
            owner: account as string
          },
          select: {
            assetId: true,
            batchGroup: (includeInfo === 'true') ? {
              select: {
                batches: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    images: true
                  }
                }
              }
            } : false
          }
        }),
      ]);

      const uniqueAssets = await Promise.all(
          assets.map(async (tk: any) => {
            if (!includeInfo) {
              return tk.assetId;
            }

            const year = (batches: Batch[]): string => {
              const sortedBatches = batches.sort((a: Batch, b: Batch) => Number(a.issuanceYear) - Number(b.issuanceYear));

              if (!sortedBatches[0] || !sortedBatches.length || (sortedBatches[0].issuanceYear === sortedBatches[sortedBatches.length - 1]?.issuanceYear)) {
                return `${sortedBatches[0]?.issuanceYear}`;
              }

              return `${sortedBatches[0].issuanceYear}-${sortedBatches[sortedBatches.length - 1]?.issuanceYear}`;
            };

            const yearResult = year(tk.batchGroup?.batches || []);

            return {
              assetId: tk.assetId,
              projectId: tk.batchGroup?.project?.id,
              projectName: tk.batchGroup?.project?.name,
              projectImage: tk.batchGroup?.project?.images[0] || null,
              year: yearResult,
              price: (await getAssetPrice(tk.assetId)).price,
            };
          })
      );

      const uniqueAssetIds = uniqueAssets.filter((asset, index, self) => {
        if(includeInfo) {
          return index === self.findIndex((t) => t.assetId === asset.assetId)
        } else {
          return true
        }
      });

      const uniqueTokenIds = [...new Set(tokens.map((tk) => tk.tokenId))];

      res.json({
        assets: uniqueAssetIds,
        tokens: uniqueTokenIds
      }
      );
    } catch (e) {
      console.log('e', e)
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
    // @ts-ignore
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
    // @ts-ignore
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
