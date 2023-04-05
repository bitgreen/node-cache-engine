import { Project } from '../../types/prismaTypes';
import { Event } from '@polkadot/types/interfaces';
import { prisma } from '../prisma';
import { convertHex } from '../../utils/converter';
import { ApiPromise } from '@polkadot/api';

export async function updateBatchGroupInProject(
  api: ApiPromise,
  // ex: Extrinsic,
  event: Event,
  block_date: Date
) {
  try {
    let dataEvent = event.data.toJSON();
    console.log('dataEvent', dataEvent);
    let [projectId, groupId] = dataEvent as number[];

    let dataQuery = await api.query['carbonCredits']['projects'](projectId);
    const projectArg = dataQuery.toJSON();
    let project = projectArg as unknown as Project;
    console.log(project);
    console.log("groups",project.batchGroups[groupId]);

    if (!project || !projectId) return;

    // for update of batches
    // let batchGroups = Object.entries(project.batchGroups).map(
    //   ([key, value], i) => {
    //     return prisma.batchGroups.upsert({
    //       where: {
    //         assetId: value.assetId,
    //       },
    //       update: {
    //         ...value,
    //         batches: {
    //           upsert: value.batches.map((batch) => ({
    //             where: {
    //               uuid: convertHex(batch.uuid as string) as string,
    //             },
    //             update: {
    //               ...batch,
    //             },
    //             create: {
    //               ...batch,
    //               uuid: convertHex(batch.uuid as string),
    //             },
    //           })),
    //         },
    //       },
    //       create: {
    //         ...value,
    //         assetId: Date.now() + 1,
    //         groupId: Number(key),
    //         name: convertHex(value.name as string),
    //         batches: {
    //           create: value.batches.map((batch) => {
    //             return { ...batch, uuid: convertHex(batch.uuid as string) };
    //           }),
    //         },
    //       },
    //     });
    //   }
    // );

    const newBatchGroup = {
        ...project.batchGroups[groupId],
        assetId: Date.now() + 1,
        groupId: groupId,
        name: convertHex(project.batchGroups[groupId].name as string),
        batches: {
          create: project.batchGroups[groupId].batches.map((batch) => {
            return { ...batch, uuid: convertHex(batch.uuid as string) };
          }),
        },
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        batchGroups: {
            create: newBatchGroup
        },
        updated: block_date.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (updating project): ${e.message}`);
  }
}
