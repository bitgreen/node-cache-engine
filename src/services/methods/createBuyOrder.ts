import { hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import {AssetTransactionType} from '@prisma/client';

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
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create buy order): ${e.message} at ${blockNumber}`);
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
    const feesPaid = feesPaidChain.replace(/,/g, '');
    const groupId = Number(groupIdChain.replace(/,/g, ''));

    const creditPrice = (pricePerUnit as string).replace(/,/g, '')

    await prisma.assetTransaction.upsert({
      where: {
        hash: hash as string,
      },
      create: {
        hash: hash as string,
        blockNumber: blockNumber,
        type: AssetTransactionType.TRADED,
        from: seller as string,
        to: buyer as string,
        projectId: projectId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid,
        amount: units,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.TRADED,
        projectId: projectId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid,
        from: seller as string,
        to: buyer as string,
      },
    });

    // await prisma.$transaction([
    //   prisma.trade.create({
    //     data: {
    //       hash: hash as string,
    //       buyOrderId: orderId,
    //       sellOrderId: sellOrderId,
    //       blockNumber: blockNumber,
    //       projectId: projectId,
    //       creditPrice: creditPrice,
    //       units: units,
    //       groupId: groupId,
    //       createdAt: createdAt.toISOString()
    //     },
    //   }),
    // ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create trade): ${e.message} at ${blockNumber}`);
  }
}