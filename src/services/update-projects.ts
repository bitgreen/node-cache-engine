import cron from 'node-cron';
import {prisma} from "./prisma";
import {initApi} from "./polkadot-api";
import {ApiPromise} from "@polkadot/api";
import {Project} from "../types/prismaTypes";
import {convertHex} from "../utils/converter";
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
      const projectData = project.toJSON() as any

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
        assetId: value.assetId,
        groupId: Number(key),
        name: convertHex(value.name as string),
        batches: {
          create: value.batches.map((batch) => {
            return { ...batch, uuid: batch.uuid as string };
          }),
        },
      });
    }

    await prisma.project.create({
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
        where: {
          registryId: projectId
        },
        create: {
          name: convertHex(reg.name as string),
          summary: convertHex(reg.summary),
          regName: convertHex(reg.regName as string ) as RegistryName,
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
          sdgType: convertHex(sdg.sdgType as string) as SdgType,
          description: convertHex(sdg.description as string),
          references: convertHex(sdg.references as string)
        }
      }
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
        where: {
          assetId: value.assetId
        },
        create: {
          ...value,
          assetId: value.assetId,
          groupId: Number(key),
          name: convertHex(value.name as string),
          batches: {
            create: value.batches.map((batch) => {
              return { ...batch, uuid: batch.uuid as string };
            }),
          },
        }
      });
    }

    await prisma.project.update({
      where: {
        id: projectId
      },
      data: {
        name: convertHex(project.name),
        description: convertHex(project.description as string),
        location: convertHex(project.location as string),
        images: images,
        videos: videos,
        documents: documents,
        registryDetails: {
          connectOrCreate: RegistryDetails,
        },
        sdgDetails: {
          connectOrCreate: sdgDetails,
        },
        batchGroups: {
          connectOrCreate: batchGroups,
        },
        approved: project?.approved?.toString() === 'Approved',
        updatedAt: updatedAtBlock.blockDate?.toISOString() || undefined,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (updating project): ${e.message}`);
  }
}