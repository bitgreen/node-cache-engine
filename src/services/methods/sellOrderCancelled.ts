import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {AssetTransactionType} from "@prisma/client";
import {ApiPromise} from "@polkadot/api";

export async function sellOrderCancelled(
  api: ApiPromise,
  event: Event,
  blockNumber: number,
  index: number,
  hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [
      orderId,
      seller
    ] = eventData as (number | string)[];

    await prisma.assetTransaction.update({
      where: {
        uniqueId: {
          hash: hash,
          owner: seller as string
        }
      },
      data: {
        index: index,
        type: AssetTransactionType.ORDER_CANCELLED,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (cancel sell order): ${e.message}`);
  }
}
