import { DIVIDER } from './../../utils/converter';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function transaction(
  event: Event,
  blockNumber: number,
  createdAt: Date,
  hash: string
) {
  let sender: string | undefined;
  let recipient: string | undefined;
  let amount: string | undefined;

  try {
    event.data.map(async (arg: Codec, d: number) => {
      if (d === 0) {
        sender = arg.toString();
      } else if (d === 1) {
        recipient = arg.toString();
      } else if (d === 2) {
        amount = arg.toString(); /// DIVIDER;
      }
    });

    console.log('sender', sender);
    console.log('recipient', recipient);
    console.log('amount', amount);

    await prisma.transaction.create({
      data: {
        blockNumber: blockNumber,
        hash: hash as string,
        recipient: recipient as string,
        sender: sender as string,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (adding transaction): ${e.message}`);
  }
}
