import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';

export async function createSellOrder(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toJSON();
    let [orderId, assetId, projectId, groupId, units, pricePerUnit, owner] =
      data as (Number | string)[];
    console.log(event.data.toJSON());
    console.log(
      orderId,
      assetId,
      projectId,
      groupId,
      units,
      pricePerUnit,
      owner
    );
    
    await prisma.profil.update({
      where: {
        address: owner as string,
      },
      data: {
        investments: {
          update: {
            where: {
              addressProjectId: `${owner}_${projectId}`,
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
        // @ts-ignore
        console.log(`Error occurred (create sell order): ${e.message}`);
  }
}
