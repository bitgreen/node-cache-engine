import cron from 'node-cron';
import {prisma} from "./prisma";
import {initApi} from "./polkadot-api";
import {ApiPromise} from "@polkadot/api";
import {Project} from "../types/prismaTypes";
import {RegistryName, SdgType} from "@prisma/client";
import {blockExtrinsic, getBlockDate} from "./methods/blockExtrinsic";

export const updateProjectsCron = async() => {
  cron.schedule('*/5 * * * *', async () => {
    const api = await initApi();

    let projectsData = await api.query['carbonCredits']['projects'].entries();
    // const projectsJson = projectsData.toJSON();

    // console.log(projectsData)
    projectsData.forEach(([key, project]) => {
      let [projectId] = key.toHuman() as Array<string>
      const projectData = project.toPrimitive() as any

      if(!projectData) return

      prisma.project.findUnique({
        where: { id: Number(projectId) }
      }).then(exist => {
        if(exist) {
          updateProject(api, Number(projectId), projectData)
        } else {
          createProject(api, Number(projectId), projectData)
        }
      })
    })
  });
};

async function createProject(
    api: ApiPromise,
    projectId: number,
    projectData: any
) {
  try {
    let project = projectData as unknown as Project;

    const createdAtBlock = await blockExtrinsic(api, projectData.created)

    if (!project || (projectId.toString() === '')) return;

    let RegistryDetails = project.registryDetails?.map((reg) => {
      return {
        name: reg.name,
        summary: reg.summary,
        regName: reg.regName,
      };
    });
    let sdgDetails = project.sdgDetails?.map((reg) => {
      return {
        sdgType: reg.sdgType,
        description: reg.description,
        references: reg.references,
      };
    });
    let royalties = project.royalties?.map((reg) => {
      return {
        accountId: reg.accountId,
        percentOfFees: reg.percentOfFees,
      };
    });
    // let batchGroups = [];
    // for (const [key, value] of Object.entries(project.batchGroups)) {
    //   batchGroups.push({
    //     ...value,
    //     assetId: value.assetId,
    //     groupId: Number(key),
    //     name: value.name,
    //     batches: {
    //       create: value.batches.map((batch) => {
    //         return { ...batch, uuid: batch.uuid };
    //       }),
    //     },
    //   });
    // }

    await prisma.project.create({
      data: {
        id: projectId,
        originator: project.originator || 'empty',
        name: project.name,
        description: project.description,
        location: project.location,
        images: project.images,
        videos: project.videos,
        documents: project.documents,
        registryDetails: {
          create: RegistryDetails,
        },
        sdgDetails: {
          create: sdgDetails,
        },
        royalties: {
          create: royalties,
        },
        // batchGroups: {
          // create: batchGroups,
        // },
        approved: project?.approved?.toString() === 'Approved',
        createdAt: createdAtBlock.blockDate!.toISOString(),
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (creating project): ${e.message}`);
  }
}

async function updateProject(
    api: ApiPromise,
    projectId: number,
    projectData: any
) {
  try {
    let project = projectData as unknown as Project;

    const updatedAtBlock = await blockExtrinsic(api, projectData.updated)

    if (!project || (projectId.toString() === '')) return;

    let RegistryDetails = project.registryDetails?.map((reg) => {
      return {
        where: {
          registryId: projectId
        },
        create: {
          name: reg.name,
          summary: reg.summary,
          regName: reg.regName,
        }
      }
    });
    let sdgDetails = project.sdgDetails?.map((sdg) => {
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
    let royalties = project.royalties?.map((reg) => {
      return {
        accountId: reg.accountId,
        percentOfFees: reg.percentOfFees,
      };
    });
    // let batchGroups = [];
    // for (const [key, value] of Object.entries(project.batchGroups)) {
    //   batchGroups.push({
    //     where: {
    //       assetId: value.assetId
    //     },
    //     create: {
    //       ...value,
    //       assetId: value.assetId,
    //       groupId: Number(key),
    //       name: value.name,
    //       batches: {
    //         create: value.batches.map((batch) => {
    //           return { ...batch, uuid: batch.uuid };
    //         }),
    //       },
    //     }
    //   });
    // }

    await prisma.project.update({
      where: {
        id: projectId
      },
      data: {
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
        // batchGroups: {
        //   connectOrCreate: batchGroups,
        // },
        approved: project?.approved?.toString() === 'Approved',
        updatedAt: updatedAtBlock.blockDate?.toISOString() || undefined,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (updating project): ${e.message}`);
  }
}