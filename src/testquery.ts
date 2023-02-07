
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';
import { convertHex } from './utils/converter';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}
// main function (must be async)
async function main() {

  console.log("test")
  // const id = 8;
  // const api = await initApi();

  // let data  = await api.query["carbonCredits"]["projects"](id)
  // console.log(data.toJSON())
  // console.log(data.toHuman())

  // function updateBatch(
  //   projectId: number,
  //   assetId: number,
  //   retireData: RetireData
  // ) {
  //   const uuidBatch = convertHex(retireData.uuid as string)
  //   console.log("uuidBatch",uuidBatch)
  //   console.log("projectId",projectId)
  //   console.log("assetId",assetId)
  //   return prisma.project.update({
  //     where: { id: projectId },
  //     data: {
  //       batchGroups: {
  //         update: {
  //           where: { assetId: assetId },
  //           data: {
  //             retired: {
  //               increment: retireData.count
  //             },
  //             batches: {
  //               update: {
  //                 where: { uuid:uuidBatch },
  //                 data: {
  //                   retired: retireData.count
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
  const assetId = 18; // ----------- later in the event, maybe now from the extrinsic. Am besten brauch ich hier die assetId oder die uuid der batchGruppe. sonst group id und dann von projecjts holen

  let [projectId, account, amount, retireData] =   [
    29,
    '5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7',
    100,
    [
      {
        name: '',
        uuid: 'b0c2f1e8-ab0c-42f1-bead-09b88a401d0a',
        issuanceYear: 2023,
        count: 100
      }
    ]
  ] as (
    | Number
    | string
    | RetireData[]
  )[];
  let retireDataUpdate = retireData as RetireData[];
  console.log("retireDataUpdate",retireDataUpdate)
  // let updates = retireDataUpdate.map((retireData) => {
  //   return updateBatch(projectId as number, assetId, retireData);
  // });
  // console.log("updates",updates)

  console.log(projectId, account, amount, retireData);
  // await prisma.$transaction(updates);
  await prisma.project.update({
    where: { id: projectId as number},
    data: {
      batchGroups: {
        update: retireDataUpdate.map((retireData) => ({
          where: { assetId: assetId },
          data: {
            retired: {
              increment: retireData.count
            },
            batches: {
              update: {
                where: { uuid:convertHex(retireData.uuid as string) },
                data: {
                  retired: {
                    increment: retireData.count
                  }
                },
              },
            },
          },
        }))
      },
    },
  });
  console.log("Investments")
  // here update investements
  const profil = await prisma.profil.findUnique({
    where: {
      address: account as string,
    },
    include: {
      investments: {include:{buyOrders:true}},
    },
  });
  console.log(profil);

  const investment = profil?.investments.find(
    (i) => i.projectId === projectId
  );
  if (!investment) return;

  for (const buyOrder of investment.buyOrders) {
    const boReaminTokens = buyOrder.creditsOwned - buyOrder.retiredCredits;
    if (boReaminTokens === 0) continue;
    let bo2 = buyOrder.creditsOwned - (amount as number)
    if (bo2 >= 0) {
      buyOrder.retiredCredits = amount as number;
      break;
    } else {
    buyOrder.retiredCredits = buyOrder.creditsOwned
  }
}
  console.log("buyOrders",investment.buyOrders);
  let retiredCreditsSum = retireDataUpdate.reduce((acc,cv) => acc + cv.count,0);
  await prisma.profil.update({
    where: { address: account as string },
    data: {
      investments:{
        update:{
          where:{id:investment.id },
          data:{
            retiredCredits: {
              increment: retiredCreditsSum
            },
            buyOrders: {
              update: investment.buyOrders.map((buyOrder) => ({
                  where: {id: buyOrder.id },
                  data: {
                    retiredCredits: buyOrder.retiredCredits
                  }
              }))
            }
          }
        }
      }
    }
  })
  
}

main().catch(console.error);