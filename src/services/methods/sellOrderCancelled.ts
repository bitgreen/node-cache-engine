import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {AssetTransactionType} from "@prisma/client";

export async function sellOrderCancelled(
  event: Event,
  hash: string)
{
  try {
    let eventData = event.data.toJSON();

    let [
      orderId,
    ] = eventData as (number | string)[];

    await prisma.assetTransaction.update({
      where: {
        hash: hash as string,
      },
      data: {
        type: AssetTransactionType.SELL_ORDER_CANCELLED,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (cancel sell order): ${e.message}`);
  }
}
