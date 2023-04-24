import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import { queryBalances } from './createAssetsAndTokens';

export async function ccMinted(
  event: Event,
  block_date: Date,
  api: ApiPromise
) {
  try {
    let data = event.data.toJSON();
    let [projectId, groupId, recipient, amount] = data as (Number | string)[];

    console.log('Carbon credits minted', projectId, groupId, recipient, amount);

    const projectArgs = await prisma.project.findUnique({
      include: {
        batchGroups: true,
      },
      where: {
        id: projectId as number,
      },
    });
    if (!projectArgs) return;
    console.log(
      'TEST',
      projectArgs?.batchGroups.find((bg) => bg.groupId == groupId)
    );
    console.log(
      'TEST2',
      projectArgs?.batchGroups.find((bg) => bg.groupId == groupId)?.id
    );
    await prisma.$transaction([
      prisma.project.update({
        where: {
          id: projectId as number,
        },
        data: {
          batchGroups: {
            update: {
              where: {
                id: projectArgs?.batchGroups.find((bg) => bg.groupId == groupId)
                  ?.id,
              },
              data: {
                minted: amount as number,
                isMinted: true,
              },
            },
          },
          updated: block_date.toISOString(),
        },
      }),
      prisma.profil.update({
        where: {
          address: recipient as string,
        },
        data: {
          investments: {
            upsert: {
              where: { addressProjectId: `${recipient}_${projectId}` },
              create: {
                projectId: projectArgs.id,
                addressProjectId: `${recipient}_${projectId}`,
                creditsOwnedPerGroup: {
                  create: {
                    groupId: groupId as number,
                    addressGroupId: `${recipient}_${groupId}_${projectId}`,

                    creditsOwned: amount as number,
                  },
                },
                creditsOwned: amount as number,
                retiredCredits: 0,
                creditPrice: -1,
                quantity: 0,
                sellorders: undefined,
                buyOrders: undefined,
              },
              update: {
                creditsOwnedPerGroup: {
                  create: {
                    groupId: groupId as number,
                    addressGroupId: `${recipient}_${groupId}_${projectId}`,

                    creditsOwned: amount as number,
                  },
                },
                creditsOwned: {
                  increment: amount as number,
                }
              },
            },
          },
        },
      }),
    ]);
    // const [balanceBBB, balanceUSDT] = await queryBalances(
    //   api,
    //   recipient as string,
    //   'USDT'
    // );

    // await prisma.assetTransaction.create({
    //   data: {
    //     sender: '',
    //     recipient: recipient as string,
    //     assetId: projectArgs?.batchGroups[groupId as number].assetId as number,
    //     balance: balanceBBB,
    //     balanceUsd: balanceUSDT,
    //   },
    // });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (minting carbon credit): ${e.message}`);
  }
}
