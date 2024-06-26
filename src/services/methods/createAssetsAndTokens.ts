import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import {BalanceData, BlockEvent} from '../../types/types';
import { hexToBigInt } from '@polkadot/util';
import { AssetTransactionType } from '@prisma/client';
import BigNumber from "bignumber.js";
import logger from "@/utils/logger";

interface MetaData {
  deposit: string;
  name: string;
  symbol: string;
  decimals: string;
  isFrozen: string;
}

export async function createTransferAssetTransaction(
    event: Event,
    blockNumber: number,
    index: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [assetId, from, to, amount] = eventData as (number | string)[];
    amount = amount?.toString().replace(/,/g, '')

    const sent_owner = from
    const received_owner = to

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: sent_owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.SENT,
        from: from as string,
        to: to as string,
        owner: sent_owner as string,
        assetId: assetId as number,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.SENT,
      },
    });

    // Receiver
    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: received_owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.RECEIVED,
        from: from as string,
        to: to as string,
        owner: received_owner as string,
        assetId: assetId as number,
        amount: amount as string,
        createdAt: createdAt.toISOString(),
      },
      update: {
        type: AssetTransactionType.RECEIVED
      },
    });
  } catch (e: any) {
    logger.error(`createTransferAssetTransaction - Block #${blockNumber}: ${e.message}`)
  }
}

export async function createIssuedAssetTransaction(
    event: Event,
    blockNumber: number,
    index: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [assetId, owner, totalSupply] = eventData as (number | string)[];
    totalSupply = totalSupply?.toString().replace(/,/g, '')

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.ISSUED,
        from: '',
        to: owner as string,
        owner: owner as string,
        assetId: assetId as number,
        amount: totalSupply as string,
        createdAt: createdAt.toISOString(),
      },
      update: {
        index: index,
        assetId: assetId as number
      },
    });
  } catch (e: any) {
    logger.error(`createIssuedAssetTransaction - Block #${blockNumber}: ${e.message}`)
  }
}

export async function createSellOrderAssetTransaction(
    event: Event,
    blockNumber: number,
    index: number,
    createdAt: Date,
    hash: string
) {
  try {
    let eventData = event.data.toJSON();

    let [
      orderId,
      assetId,
      projectId,
      groupId,
      units,
      pricePerUnit,
      owner
    ] = eventData as (number | string)[];
    units = units?.toString().replace(/,/g, '')
    pricePerUnit = Number(pricePerUnit?.toString().replace(/,/g, '')).toString()

    await prisma.assetTransaction.upsert({
      where: {
        uniqueId: {
          hash: hash,
          owner: owner as string
        }
      },
      create: {
        hash: hash,
        blockNumber: blockNumber,
        index: index,
        type: AssetTransactionType.ORDER_CREATED,
        from: owner as string,
        to: '',
        owner: owner as string,
        assetId: assetId as number,
        amount: units as string,
        pricePerUnit: pricePerUnit,
        createdAt: createdAt.toISOString(),
      },
      update: {
        index: index,
        type: AssetTransactionType.ORDER_CREATED,
        from: owner as string,
        to: '',
        owner: owner as string,
        assetId: assetId as number,
        amount: units as string,
        pricePerUnit: pricePerUnit,
      },
    });
  } catch (e: any) {
    logger.error(`createSellOrderAssetTransaction - Block #${blockNumber}: ${e.message}`)
  }
}

export async function createTokenTransaction(
  event: Event,
  api: ApiPromise,
  blockNumber: number,
  createdAt: Date,
  hash: string
) {
  try {
    let eventData = event.data.toPrimitive();

    let currencyId, from, to, amount, amountConverted

    if(event.method === BlockEvent.BalanceSet) {
      [currencyId, to, amount] = eventData as string[];
    } else {
      [currencyId, from, to, amount] = eventData as string[];
    }

    amountConverted = new BigNumber(amount || 0).toString();

    await prisma.$transaction([
      prisma.tokenTransaction.create({
        data: {
          hash: hash as string,
          from: from as string,
          to: to as string,
          blockNumber: blockNumber,
          tokenId: currencyId as string,
          tokenName: '',
          amount: amountConverted as string,
          createdAt: createdAt.toISOString()
        },
      }),
    ]);
  } catch (e: any) {
    logger.error(`createTokenTransaction - Block #${blockNumber}: ${e.message}`)
  }
}

// function getExchangeRate(currencyId: String): number {
//   let exchangeRate = 1;
//   switch (currencyId) {
//     case 'USDT': {
//       exchangeRate = 1.02; // here gecko coin api
//       break;
//     }
//     case 'DOT': {
//       exchangeRate = 6.28; // here gecko coin api
//       break;
//     }
//   }
//   return exchangeRate;
// }

export async function queryBalances(
  api: ApiPromise,
  to: string,
  currencyId: string
) {
  //BBB Tokens Balance
  // let dataQuery = await api.query['system']['account'](to);
  // const { data: dataBBB } = dataQuery.toHuman() as unknown as Account;
  // console.log('data BBB', dataBBB);

  // @ts-ignore
  let dataQueryUSDT = await api.query['tokens']['accounts'](to, currencyId);
  const { free: balanceUSDT } =
    dataQueryUSDT.toHuman() as unknown as BalanceData;
  return [balanceUSDT];
}
