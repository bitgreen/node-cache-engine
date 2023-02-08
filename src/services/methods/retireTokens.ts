import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';
import internal from 'stream';
import { convertHex } from '../../utils/converter';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function retireTokens(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let data = event.data.toJSON();
  console.log(event.data.toHuman());


  let [projectId,groupId, assetId, account, amount, retireData] = data as (
    | Number
    | string
    | RetireData[]
  )[];
  let retireDataUpdate = retireData as RetireData[];
  console.log('retireDataUpdate', retireDataUpdate);

  console.log(projectId, account, amount, retireData);
  // await prisma.$transaction(updates);
  await prisma.project.update({
    where: { id: projectId as number },
    data: {
      batchGroups: {
        update: retireDataUpdate.map((retireData) => ({
          where: { assetId: assetId as number },
          data: {
            retired: {
              increment: retireData.count,
            },
            batches: {
              update: {
                where: { uuid: convertHex(retireData.uuid as string) },
                data: {
                  retired: {
                    increment: retireData.count,
                  },
                },
              },
            },
          },
        })),
      },
    },
  });
  console.log('Investments');
  // here update investements
  const profil = await prisma.profil.findUnique({
    where: {
      address: account as string,
    },
    include: {
      investments: { include: { buyOrders: true } },
    },
  });
  console.log(profil);

  const investment = profil?.investments.find((i) => i.projectId === projectId);
  if (!investment) return;

  for (const buyOrder of investment.buyOrders) {
    const boReaminTokens = buyOrder.creditsOwned - buyOrder.retiredCredits;
    if (boReaminTokens === 0) continue;
    let bo2 = buyOrder.creditsOwned - (amount as number);
    if (bo2 >= 0) {
      buyOrder.retiredCredits = amount as number;
      break;
    } else {
      buyOrder.retiredCredits = buyOrder.creditsOwned;
    }
  }
  console.log('buyOrders', investment.buyOrders);
  let retiredCreditsSum = retireDataUpdate.reduce(
    (acc, cv) => acc + cv.count,
    0
  );
  await prisma.profil.update({
    where: { address: account as string },
    data: {
      investments: {
        update: {
          where: { id: investment.id },
          data: {
            retiredCredits: {
              increment: retiredCreditsSum,
            },
            buyOrders: {
              update: investment.buyOrders.map((buyOrder) => ({
                where: { id: buyOrder.id },
                data: {
                  retiredCredits: buyOrder.retiredCredits,
                },
              })),
            },
          },
        },
      },
    },
  });
}
