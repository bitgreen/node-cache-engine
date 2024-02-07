import { Event } from '@polkadot/types/interfaces';
import { VerificationStatus } from '@prisma/client';
import { prisma } from '../prisma';

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
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (member added kyc): ${e.message}`);
  }
}
