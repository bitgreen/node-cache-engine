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
  if (groupId === -1 || !projectId) return;
  // connect asset id with vcu project
  try {
    const batchGroupsArg = await prisma.project.findUnique({
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
              id: batchGroupsArg?.batchGroups[groupId].id,
            },
            data: {
              minted: amount,
            },
          },
        },
        updated: block_date.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (minting carbon credit): ${e.message}`);
  }
}
