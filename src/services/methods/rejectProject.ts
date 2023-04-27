import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState } from '@prisma/client';

export async function rejectProject(event: Event, updatedAt: Date) {
  try {
    let projectId;
    event.data.map(async (arg: any, d: number) => {
      if (d === 0) {
        projectId = arg.toNumber();
      }
    });

    console.log('projectId', projectId);

    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        approved: false,
        state: ProjectState.DECLINED,
        updatedAt: updatedAt.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (rejecting project): ${e.message}`);
  }
}
