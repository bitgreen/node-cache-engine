import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import { ProjectState } from '@prisma/client';
import logger from "@/utils/logger";

export async function rejectProject(blockNumber: number | BlockNumber, event: Event, updatedAt: Date) {
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
  } catch (e: any) {
    logger.error(`rejectProject - Block #${blockNumber}: ${e.message}`)
  }
}
