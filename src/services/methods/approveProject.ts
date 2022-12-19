import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState } from '@prisma/client';

export async function approveProject(
  event: Event,
  projectState: ProjectState,
  block_date: Date
) {
  let projectId;
  event.data.map(async (arg: any, d: number) => {
    if (d === 0) {
      projectId = arg.toNumber();
    }
  });
  // ex.args.map(async (arg: Codec, d: number) => {
  //   if (d === 0) {
  //     projectId = arg.toJSON();
  //   } else if (d === 1) {
  //     isApproved = arg.toString() === 'true';
  //   }
  // });
  console.log('projectId', projectId);
  console.log('Approved: ', projectState);

  try {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        approved: ProjectState.ACCEPTED ? true : false,
        state: projectState,
        updated: block_date.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (approving project): ${e.message}`);
  }
}
