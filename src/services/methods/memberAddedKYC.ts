import { Event } from '@polkadot/types/interfaces';
import { VerificationStatus } from '@prisma/client';
import { prisma } from '../prisma';
import logger from "@/utils/logger";

export async function memberAddedKYC(event: Event, block_date: Date) {
  try {
    let dataEvent = event.data.toJSON();
    console.log('dataEvent', dataEvent);
    let [memberAccount] = dataEvent as string[];
    await prisma.kYC.update({
      where: { profileAddress: memberAccount },
      data: {
        status: VerificationStatus.VERIFIED,
      },
    });
  } catch (e: any) {
    logger.error(`memberAddedKYC: ${e.message}`)

  }
}
