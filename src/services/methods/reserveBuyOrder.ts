import { hexToString } from '@polkadot/util';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import logger from "@/utils/logger";

export async function reserveBuyOrder(event: Event, createdAt: Date) {
  try {
    let dataBlock = event.data.toHuman();
    console.log('data', dataBlock);
    console.log('data', event.data.toHuman());
    let [
      orderIdChain,
      sellOrderIdChain,
      unitsChain,
      projectIdChain,
      groupId,
      pricePerUnit,
      feesPaid,
      totalAmount,
      seller,
      buyer,
    ] = dataBlock as string[];
    const orderId = Number(orderIdChain.replace(/,/g, ''));
    const sellOrderId = Number(sellOrderIdChain.replace(/,/g, ''));
    const units = Number(unitsChain.replace(/,/g, ''));
    const projectId = Number(projectIdChain.replace(/,/g, ''));

    console.log(orderId, sellOrderId, units, pricePerUnit, seller, buyer);
    const convertedPricePerunit = parseFloat(
      (pricePerUnit as string).replace(/,/g, '').slice(0, -18)
    );
    console.log('convertedPricePerunit', convertedPricePerunit);

    await prisma.buyOrderReserved.create({
      data: {
        quantity: units,
        creditPrice: convertedPricePerunit,
        adress: buyer as string,
        buyorderId: orderId,
        projectId: projectId,
        sellorderId: sellOrderId,
        createdAt: createdAt,
      },
    });
  } catch (e: any) {
    logger.error(`reserveBuyOrder: ${e.message}`)
  }
}
