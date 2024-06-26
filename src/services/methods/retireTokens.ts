import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {AssetTransactionType} from '@prisma/client';
import logger from "@/utils/logger";

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function createRetiredAssetTransaction(
    event: Event,
    blockNumber: number,
    index: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toPrimitive();

    let [
      projectId,
      groupId,
      assetId,
      account,
      amount,
      retireData,
      reason
    ] = eventData as (
        | number
        | string
        | RetireData[]
        )[];
    let retireDataUpdate = retireData as RetireData[];
    // @ts-ignore
    amount = amount.toString().replace(/,/g, '')

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: account as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.RETIRED,
        from: account as string,
        to: '',
        owner: account as string,
        assetId: assetId as number,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
        data: JSON.stringify(retireDataUpdate),
        reason: reason as string
      },
      update: {
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.RETIRED,
        assetId: assetId as number,
        from: account as string,
        to: '',
        owner: account as string,
        data: JSON.stringify(retireDataUpdate),
        reason: reason as string
      },
    });
  } catch (e: any) {
    logger.error(`createRetiredAssetTransaction - Block #${blockNumber}: ${e.message}`)
  }
}
