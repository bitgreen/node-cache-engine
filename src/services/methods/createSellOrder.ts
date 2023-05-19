import { hexToBigInt, hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function createSellOrder(event: Event, createdAt: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toHuman();
    let [orderIdChain, assetIdChain, projectIdChain, groupIdChain, unitsChain, pricePerUnit, owner] =
      data as (string)[];
    const convertedPricePerunit = parseFloat(pricePerUnit.replace(/,/g, "").slice(0,-18));
    console.log("convertedPricePerunit",convertedPricePerunit)
    const orderId = Number(orderIdChain.replace(/,/g,""))
    const assetId = Number(assetIdChain.replace(/,/g,""))
    const projectId = Number(projectIdChain.replace(/,/g,""))
    const groupId = Number(groupIdChain.replace(/,/g,""))
    const units = Number(unitsChain.replace(/,/g,""))
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
              creditPrice:  convertedPricePerunit,
              quantity: {
                increment: units,
              },
              creditsOwned: {
                decrement: units,
              },
              totalValue: {
                increment: (Number(convertedPricePerunit)) * units,
              },
              sellorders: {
                create: {
                  assetId: assetId,
                  groupId: groupId,
                  units: units,
                  unitsRemain: units,
                  orderId: orderId,
                  pricePerUnit:convertedPricePerunit,
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
                      decrement: units,
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
