import { DIVIDER } from './../../utils/converter';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import logger from "@/utils/logger";

export async function transaction(
  event: Event,
  blockNumber: number,
  createdAt: Date,
  hash: string
) {
  let from: string | undefined;
  let to: string | undefined;
  let amount: string | undefined;

  try {
    event.data.map(async (arg: Codec, d: number) => {
      if (d === 0) {
        from = arg.toString();
      } else if (d === 1) {
        to = arg.toString();
      } else if (d === 2) {
        amount = arg.toString(); /// DIVIDER;
      }
    });

    console.log('from', from);
    console.log('to', to);
    console.log('amount', amount);

    await prisma.transaction.create({
      data: {
        blockNumber: blockNumber,
        hash: hash as string,
        from: from as string,
        to: to as string,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
      },
    });
  } catch (e: any) {
    logger.error(`transaction - Block #${blockNumber}: ${e.message}`)
  }
}
