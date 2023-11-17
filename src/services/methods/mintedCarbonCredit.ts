import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import { queryBalances } from './createAssetsAndTokens';
import {AssetTransactionType} from '@prisma/client';

export async function ccMinted(
    event: Event,
    blockNumber: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [projectId, groupId, to, amount] = eventData as (number | string)[];
    amount = Number(amount.toString().replace(/,/g, ''))

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash as string,
          owner: to as string
        }
      },
      create: {
        hash: hash as string,
        blockNumber: blockNumber,
        type: AssetTransactionType.ISSUED,
        from: '',
        to: to as string,
        owner: to as string,
        amount: amount,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.ISSUED
      },
    });
  } catch (e) {

  }
}
