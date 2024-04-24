import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import {BatchGroupType, ProjectState, SdgType} from '@prisma/client';
import {ApiPromise} from "@polkadot/api";
import {blockExtrinsic} from "../../services/methods/blockExtrinsic";
import logger from "@/utils/logger";
import * as process from "process";

export async function createOrUpdateProject(
    blockNumber: number | BlockNumber,
    api: ApiPromise,
    event: Event,
    createdAt: Date
) {
  const eventData = event.toHuman()

  if (typeof eventData.data !== 'object' || eventData.data === null || !('projectId' in eventData.data)) {
    return false
  }

  const projectId = parseInt(eventData.data.projectId as string)

  return createProject(projectId, blockNumber as number, api)
}

export async function createProject(projectId: number, blockNumber: number, api: ApiPromise) {
  try {
    // @ts-ignore
    const projectData = await api.query['carbonCredits']['projects'](projectId)
    const project: any = projectData.toPrimitive()

    if(!project) return false

    const createdAtBlock = await blockExtrinsic(api, project.created)

    const RegistryDetails = project.registryDetails?.map((reg: any) => {
      if(!reg.id) return undefined

      return {
        where: {
          registryId: reg.id
        },
        create: {
          registryId: reg.id,
          name: reg.name,
          summary: reg.summary,
          regName: reg.regName,
        }
      }
    });

    const sdgDetails = project.sdgDetails?.map((sdg: any) => {
      return {
        where: {
          sdgIdentifier: {
            projectId: projectId,
            sdgType: sdg.sdgType as SdgType,
          }
        },
        create: {
          sdgType: sdg.sdgType,
          description: sdg.description,
          references: sdg.references
        }
      }
    });

    const royalties = project.royalties?.map((roy: any) => {
      return undefined;
      //TODO: temp disabled
      return {
        where: {

        },
        create: {
          accountId: roy.accountId,
          percentOfFees: roy.percentOfFees,
        }
      };
    });

    await prisma.project.upsert({
      where: {
        id: projectId,
      },
      create: {
        id: projectId,
        originator: project.originator,
        name: project.name,
        description: project.description,
        location: project.location,
        images: project.images,
        videos: project.videos,
        documents: project.documents,
        registryDetails: {
          connectOrCreate: RegistryDetails,
        },
        sdgDetails: {
          connectOrCreate: sdgDetails,
        },
        royalties: {
          connectOrCreate: royalties,
        },
        approved: project?.approved?.toString() === 'Approved',
        createdAt: createdAtBlock.blockDate!.toISOString(),
        type: project?.projectType
      },
      update: {
        originator: project.originator,
        name: project.name,
        description: project.description,
        location: project.location,
        images: project.images,
        videos: project.videos,
        documents: project.documents,
        registryDetails: {
          connectOrCreate: RegistryDetails,
        },
        sdgDetails: {
          connectOrCreate: sdgDetails,
        },
        royalties: {
          connectOrCreate: royalties,
        },
        approved: project?.approved?.toString() === 'Approved',
        createdAt: createdAtBlock.blockDate!.toISOString(),
      },
    });

    // to update batch groups
    await updateProjectData(Number(projectId), project)
  } catch (e: any) {
    logger.error(`createOrUpdateProject - Block #${blockNumber}: ${e.message}`)
  }

}

export async function refreshProjectData(projectId: number, api: ApiPromise) {
  // @ts-ignore
  const projectData = await api.query['carbonCredits']['projects'](projectId)
  const project: any = projectData.toPrimitive()

  await updateProjectData(projectId, project)
}

export async function updateProjectData(projectId: number, projectData: any) {
  // console.log('updateProjectData')
  // console.log('projectId', projectId)
  // console.log('projectData', projectData)

  try {
    const batchGroups = [];
    for (const [groupId, batchGroup] of Object.entries(projectData.batchGroups) as [string, any][]) {
      if(batchGroup.credits || batchGroup.forwards || batchGroup.shares) {
        const data = batchGroup.credits || batchGroup.forwards || batchGroup.shares
        const type = batchGroup.credits ? BatchGroupType.CREDITS : (batchGroup.forwards ? BatchGroupType.FORWARDS : BatchGroupType.SHARES)

        const existingBatchGroup = await prisma.batchGroups.findUnique({
          where: {
            uniqueId: {
              projectId: Number(projectId),
              groupId: Number(groupId)
            }
          }
        })

        const batches = {
          ...(existingBatchGroup
                  ? { connectOrCreate: data.batches?.map((batch: any, i: number) => ({
                      where: { uniqueId: { batchGroupId: Number(existingBatchGroup?.id), index: i } },
                      create: { ...batch, uuid: batch.uuid, index: i }
                    })) }
                  : { create: data.batches }
          )};

        batchGroups.push(prisma.batchGroups.upsert({
          where: {
            uniqueId: {
              projectId: Number(projectId),
              groupId: Number(groupId)
            }
          },
          create: {
            ...data,
            assetId: Number(data.minted) > 0 ? Number(data.assetId) : null,
            type: type,
            groupId: Number(groupId),
            projectId: Number(projectId),
            batches: batches,
          },
          update: {
            ...data,
            assetId: Number(data.minted) > 0 ? Number(data.assetId) : null,
            batches: batches,
          }
        }))
      }

      if(batchGroup.donations) {
        const data = batchGroup.donations

        batchGroups.push(prisma.batchGroups.upsert({
          where: {
            uniqueId: {
              projectId: Number(projectId),
              groupId: Number(groupId)
            }
          },
          create: {
            ...data,
            type: BatchGroupType.DONATIONS,
            groupId: Number(groupId),
            projectId: Number(projectId)
          },
          update: {
            ...data,
          }
        }))
      }
    }

    await prisma.$transaction(batchGroups)
  } catch (e: any) {
    logger.error(`updateProjectData - Project #${projectId}: ${e.message}`)
  }
}