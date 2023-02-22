import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import { queryBalances } from './createAssetsAndTokens';

export async function ccMinted(
  ex: Extrinsic,
  block_date: Date,
  api: ApiPromise
) {
  let projectId,
    groupId: number = -1,
    amount;
  try {
    ex.args.map(async (arg: Codec, d: number) => {
      if (d === 0) {
        projectId = arg.toJSON();
      } else if (d === 1) {
        groupId = arg.toJSON() as number;
      } else if (d === 2) {
        amount = arg.toJSON() as number;
      }
    });
    console.log("Carbon credits minted", projectId,groupId,amount)
    if (groupId === -1 || !projectId || !amount) return;
    // connect asset id with vcu project

    const projectArgs = await prisma.project.findUnique({
      include: {
        batchGroups: true,
      },
      where: {
        id: projectId,
      },
    });
    if (!projectArgs) return;

    await prisma.$transaction([
      prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          batchGroups: {
            update: {
              where: {
                id: projectArgs?.batchGroups[groupId].id,
              },
              data: {
                minted: amount,
                isMinted: true,
              },
            },
          },
          updated: block_date.toISOString(),
        },
      }),
      prisma.profil.update({
        where: {
          address: projectArgs?.originator,
        },
        data: {
          investments: {
            create: {
              projectId: projectArgs.id,
              addressProjectId: `${projectArgs?.originator}_${projectId}`,
              creditsOwnedPerGroup: {
                create: {
                  groupId: groupId as number,
                  addressGroupId: `${projectArgs?.originator}_${groupId}_${projectId}`,

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
          },
        },
      }),
    ]);
    const [balanceBBB, balanceUSDT] = await queryBalances(
      api,
      projectArgs?.originator as string,
      'USDT'
    );

    await prisma.assetTransaction.create({
      data: {
        sender: '',
        recipient: projectArgs?.originator as string,
        assetId: projectArgs?.batchGroups[groupId].assetId as number,
        balance: balanceBBB,
        balanceUsd: balanceUSDT,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (minting carbon credit): ${e.message}`);
  }
}
