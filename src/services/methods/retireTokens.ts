import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {AssetTransactionType} from '@prisma/client';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function createRetiredAssetTransaction(
    event: Event,
    blockNumber: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [
      projectId,
      groupId,
      assetId,
      account,
      amount,
      retireData
    ] = eventData as (
        | number
        | string
        | RetireData[]
        )[];
    let retireDataUpdate = retireData as RetireData[];
    amount = Number(amount.toString().replace(/,/g, ''))

    await prisma.assetTransaction.upsert({
      where: {
        hash: hash as string,
      },
      create: {
        hash: hash as string,
        blockNumber: blockNumber,
        type: AssetTransactionType.RETIRED,
        from: account as string,
        to: '',
        projectId: projectId as number,
        assetId: assetId as number,
        amount: amount,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.RETIRED,
        projectId: projectId as number,
        assetId: assetId as number,
        from: account as string,
        to: '',
      },
    });
  } catch (e: any) {
    console.log(`Error occurred (asset retired transaction): ${e.message}`);
  }
}
