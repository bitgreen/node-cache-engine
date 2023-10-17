import { hexToBigInt, hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';

export async function createSellOrder(event: Event, createdAt: Date, blockNumber: number | BlockNumber) {
  //[orderId, assetId, units, pricePerUnit, owner]
  try {
    let data = event.data.toHuman();
    let [orderIdChain, assetIdChain, projectIdChain, groupIdChain, unitsChain, pricePerUnit, owner] =
      data as (string)[];
    const convertedPricePerunit = parseFloat(pricePerUnit.replace(/,/g, "").slice(0,-18)) || 0;
    console.log("pricePerUnit",pricePerUnit)
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
    await prisma.sellOrder.create({
      data: {
        assetId: assetId,
        groupId: groupId,
        units: units,
        unitsRemain: units,
        orderId: orderId,
        pricePerUnit: convertedPricePerunit,
        owner: owner as string,
        createdAt: createdAt.toISOString()
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create sell order): ${e.message} at ${blockNumber}`);
    process.exit(0)
  }
}
