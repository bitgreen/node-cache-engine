import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { CreditTransactionType } from '@prisma/client';
import { CarbonCreditTransactionType } from '@prisma/client';
import { convertHex } from '../../utils/converter';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function retireTokens(event: Event, createdAt: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toJSON();

    let [projectId, groupId, assetId, account, amount, retireData] = data as (
      | Number
      | string
      | RetireData[]
    )[];
    let retireDataUpdate = retireData as RetireData[];
    console.log(projectId, account, amount, retireData);

    let retiredCreditsSum = retireDataUpdate.reduce(
      (acc, cv) => acc + cv.count,
      0
    );

    await prisma.creditTransaction.create({
      data: {
        type: CreditTransactionType.RETIRE,
        projectId: projectId as number,
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
        credits: amount as number,
        creditPrice: 0,
        owner: account as string,
        from: account as string,
        to: '',
        fee: 0,
        createdAt: createdAt.toISOString(),
      }
    });

    await prisma.carbonCreditAssetTransaction.create({
      data: {
        type: CarbonCreditTransactionType.RETIRED,
        projectId: projectId as number,
        credits: amount as number,
        pricePerUnit: 0,
        from: account as string,
        to: account as string,
        fee: 0,
        createdAt: createdAt.toISOString(),
      }
    });
    
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (retireing project): ${e.message}`);
  }
}
