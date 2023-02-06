import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';

export async function ccMinted(ex: Extrinsic, block_date: Date) {
  let projectId,
    groupId: number = -1,
    amount;
    
  ex.args.map(async (arg: Codec, d: number) => {
    if (d === 0) {
      projectId = arg.toJSON();
    } else if (d === 1) {
      groupId = arg.toJSON() as number;
    } else if (d === 2) {
      amount = arg.toJSON() as number;
    }
  });
  console.log('MINTED');
  if (groupId === -1 || !projectId || !amount) return;
  // connect asset id with vcu project
  console.log('MINTED 1');
  console.log('amount', amount);
  try {
    const projectArgs = await prisma.project.findUnique({
      include: {
        batchGroups: true,
      },
      where: {
        id: projectId,
      },
    });
    await prisma.project.update({
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
    });
    if (!projectArgs) return;

    await prisma.profil.update({
      where: {
        address: projectArgs?.originator,
      },
      data: {
        investments: {
          create: {
            projectId: projectArgs.id,
            creditsOwned: amount as number,
            retiredCredits: 0,
            creditPrice: -1,
            quantity: 0,
            sellorders: undefined,
            buyOrders:undefined
          },
        },
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (minting carbon credit): ${e.message}`);
  }
}
