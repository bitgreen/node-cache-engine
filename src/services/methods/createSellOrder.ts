import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';

export async function createSellOrder(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let data = event.data.toJSON();
  let [orderId, assetId,projectId,groupId, units, pricePerUnit, owner] = data as (
    | Number
    | string
  )[];
  console.log(event.data.toJSON());
  console.log(orderId, assetId,projectId,groupId, units, pricePerUnit, owner);

  try {
  //   const project = await prisma.project.findMany({
  //     where: {
  //       batchGroups: {
  //         some: {
  //           assetId: assetId as number,
  //         },
  //       },
  //     },
  //   });
  //   console.log(project);

  //   if (!project) return;
    const profil = await prisma.profil.findUnique({
      where: {
        address: owner as string,
      },
      include: {
        investments: true,
      },
    });
    console.log(profil);
    // TODO: Here also search for assetId. Multiple investement could be same project even for same profil
    const investmentid = profil?.investments.find(
      (i) => i.projectId === projectId
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
                  unitsRemain: units as number,
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
