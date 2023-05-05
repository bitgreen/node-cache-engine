import { hexToBigInt, hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function createSellOrder(event: Event, createdAt: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toHuman();
    let [orderId, assetId, projectId, groupId, units, pricePerUnit, owner] =
      data as (string)[];
    console.log(
      orderId,
      assetId,
      projectId,
      groupId,
      units,
      pricePerUnit,
      owner
    );
    const convertedPricePerunit = parseFloat(pricePerUnit.replace(/,/g, "").slice(0,-18));
    console.log("convertedPricePerunit",convertedPricePerunit)
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
              creditPrice:  convertedPricePerunit,
              quantity: {
                increment: Number(units),
              },
              creditsOwned: {
                decrement: Number(units),
              },
              totalValue: {
                increment: (Number(convertedPricePerunit)) * (Number(units)),
              },
              sellorders: {
                create: {
                  assetId: Number(assetId),
                  groupId: Number(groupId),
                  units: Number(units),
                  unitsRemain: Number(units),
                  orderId: Number(orderId),
                  pricePerUnit: Number(convertedPricePerunit),
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
                      decrement: Number(units),
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
