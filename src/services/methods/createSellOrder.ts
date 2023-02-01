import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';

export async function createSellOrder(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let data = event.data.toJSON();
  let [orderId, assetId, units, pricePerUnit, owner] = data as (
    | Number
    | string
  )[];
  let projectId = 34; // later integrated in event
  console.log(event.data.toJSON());
  console.log(orderId, assetId, units, pricePerUnit, owner);

  try {
    const project = await prisma.project.findMany({
      where: {
        batchGroups: {
          some: {
            assetId: assetId as number,
          },
        },
      },
    });
    console.log(project);

    if (!project) return;
    const profil = await prisma.profil.findUnique({
      where: {
        address: owner as string,
      },
      include: {
        investments: true,
      },
    });
    console.log(profil);
    // instead od project we can use in the future projectId
    const investmentid = profil?.investments.find(
      (i) => i.projectId === project[0].id
    )?.id;
    console.log('investmentid', investmentid);
    await prisma.profil.update({
      where: {
        address: owner as string,
      },
      data: {
        investments: {
          update: {
            where: {
              id: investmentid,
            },
            data: {
              creditPrice: pricePerUnit as number,
              sellorders: {
                create: {
                  assetId: assetId as number,
                  units: units as number,
                  orderId: orderId as number,
                  pricePerUnit: pricePerUnit as number,
                  owner: owner as string,
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}
