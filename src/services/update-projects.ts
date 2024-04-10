import cron from 'node-cron';
import {prisma} from "./prisma";
import {initApi} from "./polkadot-api";
import {createProject, updateProjectData} from "../services/methods/createOrUpdateProject";
import {ApiPromise} from "@polkadot/api";
import {BatchGroups} from "@prisma/client";
import {groupBy, sortBy} from 'lodash';
import BigNumber from "bignumber.js";

export const updateBatchGroupsCron = async() => {
  // cron.schedule('*/1 * * * *', async () => {
    await updateAllBatchGroups()
  // });
};

export const updateProjectsCron = async() => {
  cron.schedule('*/5 * * * *', async () => {
    await updateAllProjects()
  });
};

export const updateAllProjects = async(api?: ApiPromise) => {
  if(!api) {
    api = await initApi();
  }

  let allProjectsData = await api.query['carbonCredits']['projects'].entries();
  // const projectsJson = projectsData.toJSON();
  // console.log('projectsData', projectsData)

  for(const [key, project] of allProjectsData) {
    let [projectId] = key.toHuman() as Array<string>
    const projectData = project.toPrimitive() as any

    if(!projectData) return

    const exists = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    })

    if(!exists) {
      await createProject(Number(projectId), projectData.created, api)
    }

    await updateProjectData(Number(projectId), projectData)
  }

  return true
}

export const updateAllBatchGroups = async(api?: ApiPromise) => {
  if(!api) {
    api = await initApi();
  }

  const sellOrdersData = await api.query['dex']['orders'].entries()
  const allProjectsData = await prisma.project.findMany({
    include: {
      batchGroups: true
    }
  })

  for(const project of allProjectsData) {
    await prisma.$transaction(
      project.batchGroups.map((bg: BatchGroups) => {
        const batchOrders: any = sellOrdersData.filter(([key, data]) => {
          const orderData = data.toPrimitive() as any

          return orderData.assetId === bg.assetId
        }).map(([key,order]) => {
          const orderData = order.toPrimitive() as any

          return {
            pricePerUnit: Number(new BigNumber(orderData.pricePerUnit).dividedBy(new BigNumber(10).pow(18)).toFixed(2)),
            units: orderData.units
          }
        });

        const groupedOrders = groupBy(
            batchOrders,
            (order) => order.pricePerUnit,
        )

        const sortedGroupedOrders = sortBy(Object.entries(groupedOrders), ([pricePerUnit]) => parseFloat(pricePerUnit));

        const formattedGroupedOrders = sortedGroupedOrders.map(([pricePerUnit, orders]) => ({
          pricePerUnit: parseFloat(pricePerUnit),
          units: orders.reduce((totalUnits, order) => totalUnits + order.units, 0)
        }));

        return prisma.batchGroups.update({
          where: { assetId: Number(bg.assetId) },
          data: {
            availableCredits: JSON.stringify(formattedGroupedOrders)
          },
        });
      })
    );
  }
}