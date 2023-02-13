import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';
import internal from 'stream';
import { convertHex } from '../../utils/converter';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function retireTokens(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toJSON();
    console.log(event.data.toHuman());

    let [projectId, groupId, assetId, account, amount, retireData] = data as (
      | Number
      | string
      | RetireData[]
    )[];
    let retireDataUpdate = retireData as RetireData[];
    console.log('retireDataUpdate', retireDataUpdate);

    console.log(projectId, account, amount, retireData);
    let retiredCreditsSum = retireDataUpdate.reduce(
      (acc, cv) => acc + cv.count,
      0
    );

    await prisma.$transaction([
      prisma.project.update({
        where: { id: projectId as number },
        data: {
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
        },
      }),
    ]);
    // await prisma.project.update({
    //   where: { id: projectId as number },
    //   data: {
    //     batchGroups: {
    //       update: retireDataUpdate.map((retireData) => ({
    //         where: { assetId: assetId as number },
    //         data: {
    //           retired: {
    //             increment: retireData.count,
    //           },
    //           batches: {
    //             update: {
    //               where: { uuid: convertHex(retireData.uuid as string) },
    //               data: {
    //                 retired: {
    //                   increment: retireData.count,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       })),
    //     },
    //   },
    // });

    // await prisma.profil.update({
    //   where: { address: account as string },
    //   data: {
    //     investments: {
    //       update: {
    //         where: { addressProjectId: `${account}_${projectId}` },
    //         data: {
    //           retiredCredits: {
    //             increment: retiredCreditsSum,
    //           },
    //           creditsOwnedPerGroup: {
    //             update: {
    //               where: {
    //                 addressGroupId: `${account}_${groupId}_${projectId}`,
    //               },
    //               data: {
    //                 creditsOwned: {
    //                   decrement: retiredCreditsSum as number,
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    // });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (retireing project): ${e.message}`);
  }
}
