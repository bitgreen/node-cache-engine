import { hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import {BlockNumber, Event} from '@polkadot/types/interfaces';
import {AssetTransactionType} from '@prisma/client';
import {ApiPromise} from "@polkadot/api";
import logger from "@/utils/logger";

export async function createBuyOrder(event: Event, createdAt: Date, blockNumber: number | BlockNumber,) {
  try {
    let dataBlock = event.data.toPrimitive();
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

    const orderId = Number(orderIdChain);
    const sellOrderId = Number(sellOrderIdChain);
    const units = Number(unitsChain);
    const projectId = Number(projectIdChain);
    const feesPaid = feesPaidChain || 0
    const groupId = Number(groupIdChain);

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
  } catch (e: any) {
    logger.error(`createBuyOrder - Block #${blockNumber}: ${e.message}`)
  }
}

export async function createTrade(api: ApiPromise, event: Event, createdAt: Date, blockNumber: number, index: number, hash: string) {
  try {
    let dataBlock = event.data.toPrimitive();
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

    const orderId = Number(orderIdChain);
    const sellOrderId = Number(sellOrderIdChain);
    const units = `${unitsChain}`;
    const projectId = Number(projectIdChain);
    const feesPaid = feesPaidChain.toString()?.replace(/,/g, '') || 0;
    const groupId = Number(groupIdChain);

    const creditPrice = pricePerUnit.toString().replace(/,/g, '')

    const sellOrder = (await api.query.dex.orders(sellOrderId)).toJSON() as any

    const assetId = sellOrder.assetId

    const sold_owner = seller
    const purchased_owner = buyer

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: sold_owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.SOLD,
        from: seller as string,
        to: buyer as string,
        owner: sold_owner as string,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        amount: units,
        createdAt: createdAt.toISOString(),
      },
      update: {
        index: index,
        type: AssetTransactionType.SOLD,
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
          hash: hash,
          owner: purchased_owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.PURCHASED,
        from: seller as string,
        to: buyer as string,
        owner: purchased_owner as string,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid as string,
        amount: units,
        createdAt: createdAt.toISOString(),
      },
      update: {
        index: index,
        type: AssetTransactionType.PURCHASED,
        assetId: assetId as number,
        pricePerUnit: creditPrice,
        feesPaid: feesPaid as string,
        from: seller as string,
        to: buyer as string,
        owner: purchased_owner as string,
      },
    });
  } catch (e: any) {
    logger.error(`createTrade - Block #${blockNumber}: ${e.message}`)
  }

  return
}