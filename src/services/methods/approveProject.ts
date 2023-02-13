import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState } from '@prisma/client';

export async function approveProject(event: Event, block_date: Date) {
  try {
    let projectId;
    let assetIds: number[] = [];
    event.data.map(async (arg: any, d: number) => {
      if (d === 0) {
        projectId = arg.toNumber();
      } else if (d === 1) {
        assetIds = arg.toJSON();
      }
    });
    console.log('projectId', projectId);
    console.log('assetIds: ', assetIds);
    const batchGroups = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        batchGroups: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!batchGroups) return;

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        approved: true,
        state: ProjectState.ACCEPTED,
        batchGroups: {
          update: batchGroups.batchGroups.map((bg, i) => ({
            where: {
              id: bg.id,
            },
            data: {
              assetId: assetIds[i],
            },
          })),
        },
        updated: block_date.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (approving project): ${e.message}`);
  }
}
