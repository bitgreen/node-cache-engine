import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import { queryBalances } from './createAssetsAndTokens';
import {AssetTransactionType} from '@prisma/client';

export async function ccMinted(
    event: Event,
    blockNumber: number,
    index: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [projectId, groupId, to, amount] = eventData as (number | string)[];
    amount = amount.toString().replace(/,/g, '')

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: to as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.ISSUED,
        from: '',
        to: to as string,
        owner: to as string,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
      },
      update: {
        index: index,
        type: AssetTransactionType.ISSUED
      },
    });
  } catch (e) {

  }
}
