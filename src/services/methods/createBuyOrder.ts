import { hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import {AssetTransactionType} from '@prisma/client';
import {ApiPromise} from "@polkadot/api";

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

export async function createTrade(api: ApiPromise, event: Event, createdAt: Date, blockNumber: number, hash: string) {
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

    const sellOrder = (await api.query.dex.orders(sellOrderId)).toJSON() as any

    const assetId = sellOrder.assetId

    const sold_owner = seller
    const purchased_owner = buyer

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash as string,
          owner: sold_owner as string
        }
      },
      create: {
        hash: hash as string,
        blockNumber: blockNumber,
        type: AssetTransactionType.SOLD,
        from: seller as string,
        to: buyer as string,
        owner: sold_owner as string,
        projectId: projectId as number,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        amount: units,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.SOLD,
        projectId: projectId as number,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        from: seller as string,
        to: buyer as string,
        owner: sold_owner as string,
      },
    });

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash as string,
          owner: purchased_owner as string
        }
      },
      create: {
        hash: hash as string,
        blockNumber: blockNumber,
        type: AssetTransactionType.PURCHASED,
        from: seller as string,
        to: buyer as string,
        owner: purchased_owner as string,
        projectId: projectId as number,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid,
        amount: units,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.PURCHASED,
        projectId: projectId as number,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid,
        from: seller as string,
        to: buyer as string,
        owner: purchased_owner as string,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create trade): ${e.message} at ${blockNumber}`);
  }
}