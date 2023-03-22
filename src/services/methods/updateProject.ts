import { Project } from '../../types/prismaTypes';
import { Event } from '@polkadot/types/interfaces';
import { prisma } from '../prisma';
import { convertHex } from '../../utils/converter';
import { ApiPromise } from '@polkadot/api';
import { RegistryName, Prisma, SdgType } from '@prisma/client';

export async function updateProject(
  api: ApiPromise,
  // ex: Extrinsic,
  event: Event,
  block_date: Date
) {
  try {
    let dataEvent = event.data.toJSON();
    console.log('dataEvent', dataEvent);
    let [projectId] = dataEvent as number[];

    let dataQuery = await api.query['carbonCredits']['projects'](projectId);
    const projectArg = dataQuery.toJSON();
    let project = projectArg as unknown as Project;
    console.log(project);
    console.log(project.batchGroups["0"].batches);

    if (!project || !projectId) return;
    let images: string[] = project.images?.map((image: string) =>
      convertHex(image as string)
    );
    let videos: string[] = project.videos?.map((video: string) =>
      convertHex(video as string)
    );
    let documents: string[] = project.documents?.map((document: string) =>
      convertHex(document as string)
    );

    let RegistryDetails = project.registryDetails?.map((reg) => {
      return {
        where: { id: convertHex(reg.id) },
        data: {
          name: convertHex(reg.name as string),
          summary: convertHex(reg.summary),
          regName: convertHex(reg.regName as string) as RegistryName,
        },
      };
    });
    // Issue because there is no id coming back from the chain
    // let sdgDetails = project.sdgDetails?.map((reg) => {
    //   return {
    //     where: { id: reg.id },
    //     data: {
    //       sdgType: convertHex(reg.sdgType as string) as SdgType,
    //       description: convertHex(reg.description as string),
    //       references: convertHex(reg.references as string),
    //     },
    //   };
    // });
    // let royalties = project.royalties?.map((reg) => {
    //   return {
    //     where9: { id: reg.id },
    //     data: {
    //       accountId: convertHex(reg.accountId),
    //       percentOfFees: reg.percentOfFees,
    //     },
    //   };
    // });
    // chain not allow batch update therefore always same data
    let batchGroups = Object.entries(project.batchGroups).map(
      ([key, value], i) => {
        return prisma.batchGroups.upsert({
          where: {
            assetId: value.assetId,
          },
          update: {
            ...value,
            batches: {
              upsert: value.batches.map((batch) => ({
                where: {
                  uuid: convertHex(batch.uuid as string) as string,
                },
                update: {
                  ...batch,
                },
                create: {
                  ...batch,
                  uuid: convertHex(batch.uuid as string),
                },
              })),
            },
          },
          create: {
            ...value,
            assetId: Date.now() + 1,
            groupId: Number(key),
            name: convertHex(value.name as string),
            batches: {
              create: value.batches.map((batch) => {
                return { ...batch, uuid: convertHex(batch.uuid as string) };
              }),
            },
          },
        });
      }
    );

    // await prisma.$transaction(batchGroups);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        id: projectId,
        originator: project.originator
          ? convertHex(project.originator)
          : 'empty',
        name: convertHex(project.name),
        description: convertHex(project.description as string),
        location: convertHex(project.location as string),
        images: images,
        videos: videos,
        documents: documents,
        registryDetails: {
          update: RegistryDetails
        },
        // sdgDetails: {
        //   update: sdgDetails,
        // },
        // royalties: {
        //   update: royalties,
        // },
        approved: project.approved,
        created: block_date.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (updating project): ${e.message}`);
  }
}
