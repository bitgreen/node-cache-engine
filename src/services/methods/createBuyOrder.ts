import { hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import { CreditTransactionType } from '@prisma/client';

export async function createBuyOrder(event: Event, createdAt: Date, blockNumber: number | BlockNumber,) {
  try {
    let dataBlock = event.data.toHuman();
    let [
      orderIdChain,
      sellOrderIdChain,
      unitsChain,
      projectIdChain,
      groupIdChain,
      pricePerUnit,
      feesPaidChain,
      seller,
      buyer,
    ] = dataBlock as string[];
    const orderId = Number(orderIdChain.replace(/,/g, ''));
    const sellOrderId = Number(sellOrderIdChain.replace(/,/g, ''));
    const units = Number(unitsChain.replace(/,/g, ''));
    const projectId = Number(projectIdChain.replace(/,/g, ''));
    const feesPaid = Number(feesPaidChain.replace(/,/g, ''));
    const groupId = Number(groupIdChain.replace(/,/g, ''));

    console.log(orderId, sellOrderId, units, pricePerUnit, seller, buyer);
    const convertedPricePerunit = parseFloat(
      (pricePerUnit as string).replace(/,/g, '').slice(0, -18)
    ) || 0;

    await prisma.buyOrder.create({
      data: {
        creditsOwned: units,
        retiredCredits: 0,
        creditPrice: convertedPricePerunit as number,
        orderId: orderId,
        groupId: groupId,
        createdAt: createdAt.toISOString(),
      }
    })

    await prisma.creditTransaction.create({
      data: {
        type: CreditTransactionType.SALE,
        projectId: projectId,
        description: '',
        credits: units,
        creditPrice: convertedPricePerunit as number,
        owner: seller as string,
        from: seller as string,
        to: buyer as string,
        fee: feesPaid,
        createdAt: createdAt.toISOString(),
      }
    })

    await prisma.creditTransaction.create({
      data: {
        type: CreditTransactionType.PURCHASE,
        projectId: projectId,
        description: '',
        credits: units,
        creditPrice: convertedPricePerunit as number,
        owner: buyer as string,
        from: seller as string,
        to: buyer as string,
        fee: feesPaid,
        createdAt: createdAt.toISOString(),
      }
    })
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create buy order): ${e.message} at ${blockNumber}`);
    process.exit(0)
  }
}

export async function createTrade(event: Event, createdAt: Date, blockNumber: number, hash: string) {
  try {
    let dataBlock = event.data.toHuman();
    let [
      orderIdChain,
      sellOrderIdChain,
      unitsChain,
      projectIdChain,
      groupIdChain,
      pricePerUnit,
      feesPaidChain,
      seller,
      buyer,
    ] = dataBlock as string[];
    const orderId = Number(orderIdChain.replace(/,/g, ''));
    const sellOrderId = Number(sellOrderIdChain.replace(/,/g, ''));
    const units = Number(unitsChain.replace(/,/g, ''));
    const projectId = Number(projectIdChain.replace(/,/g, ''));
    const feesPaid = Number(feesPaidChain.replace(/,/g, ''));
    const groupId = Number(groupIdChain.replace(/,/g, ''));

    const creditPrice = (pricePerUnit as string).replace(/,/g, '')

    await prisma.$transaction([
      prisma.trade.create({
        data: {
          hash: hash as string,
          buyOrderId: orderId,
          sellOrderId: sellOrderId,
          blockNumber: blockNumber,
          projectId: projectId,
          creditPrice: creditPrice,
          units: units,
          groupId: groupId,
          createdAt: createdAt.toISOString()
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create trade): ${e.message} at ${blockNumber}`);
  }
}