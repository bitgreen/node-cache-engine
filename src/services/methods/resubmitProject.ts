import { Project } from '../../types/prismaTypes';
import { Event } from '@polkadot/types/interfaces';
import { prisma } from '../prisma';
import { convertHex } from '../../utils/converter';
import { ApiPromise } from '@polkadot/api';
import { RegistryName } from '@prisma/client';

export async function resubmitProject(
    api: ApiPromise,
    // ex: Extrinsic,
    event: Event,
    block_date: Date
  ) {
    try {
      let dataEvent = event.data.toJSON();
      console.log("dataEvent",dataEvent)
      let [projectId] = dataEvent as number[];
  
      let dataQuery = await api.query['carbonCredits']['projects'](projectId);
      const projectArg = dataQuery.toJSON();
      let project = projectArg as unknown as Project;
      console.log(project)
  
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
          name: convertHex(reg.name as string),
          summary: convertHex(reg.summary),
          regName: convertHex(reg.regName as string ) as RegistryName,
        };
      });
      let sdgDetails = project.sdgDetails?.map((reg) => {
        return {
          sdgType: convertHex(reg.sdgType as string),
          description: convertHex(reg.description as string),
          references: convertHex(reg.references as string),
        };
      });
      let royalties = project.royalties?.map((reg) => {
        return {
          accountId: convertHex(reg.accountId),
          percentOfFees: reg.percentOfFees,
        };
      });
      let batchGroups = [];
      for (const [key, value] of Object.entries(project.batchGroups)) {
        batchGroups.push({
          ...value,
          assetId: Date.now() + 1,
          groupId: Number(key),
          name: convertHex(value.name as string),
          batches: {
            create: value.batches.map((batch) => {
              return { ...batch, uuid: convertHex(batch.uuid as string) };
            }),
          },
        });
      }
  
      await prisma.project.update({
        where: {id: projectId},
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
            create: RegistryDetails,
          },
          sdgDetails: {
            create: sdgDetails,
          },
          royalties: {
            create: royalties,
          },
          batchGroups: {
            create: batchGroups,
          },
          approved: project.approved,
          created: block_date.toISOString(),
        },
      });
     } catch (e) {
      // @ts-ignore
      console.log(`Error occurred (creating project): ${e.message}`);
     }
  }
  