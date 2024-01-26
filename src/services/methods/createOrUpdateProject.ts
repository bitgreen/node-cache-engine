import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {BatchGroupType, ProjectState, SdgType} from '@prisma/client';
import {ApiPromise} from "@polkadot/api";
import {blockExtrinsic} from "../../services/methods/blockExtrinsic";

export async function createOrUpdateProject(
    api: ApiPromise,
    event: Event,
    createdAt: Date
) {
  try {
    const eventData = event.toHuman()

    if (typeof eventData.data !== 'object' || eventData.data === null || !('projectId' in eventData.data)) {
      return false
    }

    const projectId = parseInt(eventData.data.projectId as string)

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

    const batchGroups = [];
    for (const [groupId, batchGroup] of Object.entries(project.batchGroups) as [string, any][]) {
      if(batchGroup.credits) {
        const data = batchGroup.credits

        batchGroups.push({
          where: {
            uniqueId: {
              projectId,
              groupId: Number(groupId)
            }
          },
          create: {
            ...data,
            assetId: Number(data.minted) > 0 ? Number(data.assetId) : null,
            type: BatchGroupType.CREDITS,
            groupId: Number(groupId),
            batches: {
              create: data.batches.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
          }
        });
      }

      if(batchGroup.donations) {
        const data = batchGroup.donations

        batchGroups.push({
          where: {
            uniqueId: {
              projectId,
              groupId: Number(groupId)
            }
          },
          create: {
            ...data,
            type: BatchGroupType.DONATIONS,
            groupId: Number(groupId),
            batches: {
              create: data?.batches?.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
          }
        });
      }
    }

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
        batchGroups: {
          connectOrCreate: batchGroups,
        },
        approved: project?.approved?.toString() === 'Approved',
        createdAt: createdAtBlock.blockDate!.toISOString(),
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
        batchGroups: {
          connectOrCreate: batchGroups,
        },
        approved: project?.approved?.toString() === 'Approved',
        createdAt: createdAtBlock.blockDate!.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (creating project): ${e.message}`);
    process.exit()

  }
}

export async function updateProjectData(projectId: number, projectData: any) {
  console.log('updateProjectData')
  // console.log('projectData', projectData)

  try {
    const batchGroups = [];
    for (const [groupId, batchGroup] of Object.entries(projectData.batchGroups) as [string, any][]) {
      if(batchGroup.credits) {
        const data = batchGroup.credits

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
            type: BatchGroupType.CREDITS,
            groupId: Number(groupId),
            projectId: Number(projectId),
            batches: {
              create: data.batches?.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
          },
          update: {
            ...data,
            assetId: Number(data.minted) > 0 ? Number(data.assetId) : null,
            batches: {
              create: data.batches?.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
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
            projectId: Number(projectId),
            batches: {
              create: data?.batches?.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
          },
          update: {
            ...data,
            batches: {
              create: data.batches?.map((batch: any) => {
                return { ...batch, uuid: batch.uuid };
              }),
            },
          }
        }))
      }
    }

    await prisma.$transaction(batchGroups)
  } catch (e) {
    console.log(projectId)
    console.log('error updating project', e)
  }
}