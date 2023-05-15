import { hexToString } from '@polkadot/util';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';


export async function reserveBuyOrder(event: Event, createdAt: Date) {
  try {
    let dataBlock = event.data.toJSON();
    console.log("data", dataBlock);
    console.log("data", event.data.toHuman());
    let [
      orderId,
      sellOrderId,
      units,
      projectId,
      groupId,
      pricePerUnit,
      feesPaid,
      totalAmount,
      seller,
      buyer,
    ] = dataBlock as (Number | string)[];

    console.log(orderId,sellOrderId, units, pricePerUnit, seller, buyer);
    const convertedPricePerunit = parseFloat((hexToString(pricePerUnit as string) ).replace(/,/g, "").slice(0,-18));
    console.log("convertedPricePerunit", convertedPricePerunit);

    await prisma.buyOrderReserved.create({
      data: {
        quantity   : units as number,
        creditPrice : convertedPricePerunit,
        adress     : buyer as string,
        buyorderId : orderId as number,
        sellorderId:  sellOrderId as number,  
        createdAt: createdAt
      }
    })
   
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (reserve buy order): ${e.message}`);

  }
}
