import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { CreditTransactionType } from '@prisma/client';

import { convertHex } from '../../utils/converter';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function retireTokens(event: Event, updatedAt: Date) {
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

    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId as number },
        data: {
          updatedAt: updatedAt.toISOString(),
          batchGroups: {
            update: retireDataUpdate.map((retireData) => ({
              where: { assetId: assetId as number },
              data: {
                retired: {
                  increment: retireData.count,
                },
                batches: {
                  update: {
                    where: { uuid: convertHex(retireData.uuid as string) },
                    data: {
                      retired: {
                        increment: retireData.count,
                      },
                    },
                  },
                },
              },
            })),
          },
        },
      }),
      prisma.profil.update({
        where: { address: account as string },
        data: {
          investments: {
            update: {
              where: { addressProjectId: `${account}_${projectId}` },
              data: {
                retiredCredits: {
                  increment: retiredCreditsSum,
                },
                creditsOwnedPerGroup: {
                  update: {
                    where: {
                      addressGroupId: `${account}_${groupId}_${projectId}`,
                    },
                    data: {
                      creditsOwned: {
                        decrement: retiredCreditsSum as number,
                      },
                    },
                  },
                },
              },
            },
          },
          creditTransactions: {
            create: {
              type: CreditTransactionType.RETIRE,
              projectId: projectId as number,
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
              credits: amount as number,
              creditPrice: 0,
              from: account as string,
              to: account as string,
              fee: 0,
            },
          },
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (retireing project): ${e.message}`);
  }
}
