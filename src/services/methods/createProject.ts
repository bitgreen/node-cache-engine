import { BatchGroups, Project } from '../../types/prismaTypes';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { convertHex } from '../../utils/converter';
import { ApiPromise } from '@polkadot/api';

export async function createProject(
  api: ApiPromise,
  // ex: Extrinsic,
  event: Event,
  block_date: Date
) {
  let dataEvent = event.data.toJSON();
  let [projectId] = dataEvent as number[];

  let dataQuery = await api.query['carbonCredits']['projects'](projectId);
  const projectArg = dataQuery.toJSON();
  let project = projectArg as unknown as Project;

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
      regName: convertHex(reg.regName),
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
      ...value, assetId: Date.now() + 1,
      name: convertHex(value.name as string),
      batches: {
        create: value.batches.map((batch) => {return {...batch, uuid: convertHex(batch.uuid as string)}}),
      },
    });
  }

  let location = project.location.map((f) => {
    return {
      latitude: f[0],
      longitude: f[1],
    };
  });

  try {
    await prisma.project.create({
      data: {
        id: projectId,
        originator: project.originator
          ? convertHex(project.originator)
          : 'empty',
        name: convertHex(project.name),
        description: convertHex(project.description as string),
        location: {
          create: location,
        },
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
