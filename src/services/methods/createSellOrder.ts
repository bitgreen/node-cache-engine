import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function createSellOrder(event: Event, createdAt: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toJSON();
    let [orderId, assetId, projectId, groupId, units, pricePerUnit, owner] =
      data as (Number | string)[];
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
              creditPrice:  (pricePerUnit as number),
              quantity: {
                increment: units as number,
              },
              creditsOwned: {
                decrement: units as number,
              },
              totalValue: {
                increment: (pricePerUnit as number) * (units as number),
              },
              sellorders: {
                create: {
                  assetId: assetId as number,
                  groupId: groupId as number,
                  units: units as number,
                  unitsRemain: units as number,
                  orderId: orderId as number,
                  pricePerUnit: pricePerUnit as number,
                  owner: owner as string,
                  createdAt: createdAt.toISOString()
                },
              },
              creditsOwnedPerGroup: {
                update: {
                  where: {
                    addressGroupId: `${owner}_${groupId}_${projectId}`,
                  },
                  data: {
                    creditsOwned: {
                      decrement: units as number,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create sell order): ${e.message}`);
  }
}
