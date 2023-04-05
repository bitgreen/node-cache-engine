import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { BalanceData } from '@/types/types';
import { hexToBigInt } from '@polkadot/util';

interface MetaData {
  deposit: string;
  name: string;
  symbol: string;
  decimals: string;
  isFrozen: string;
}

export async function createAssetTransaction(
  event: Event,
  api: ApiPromise,
  blockNumber: number
) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, from, to, amount] = eventData as (Number | string)[];
    const metaData = await getMetadata(api, assetId as number);
    await prisma.assetTransaction.create({
      data: {
        sender: from as string,
        recipient: to as string,
        blockNumber: blockNumber,
        assetId: assetId as number,
        amount: amount.toString(),
        assetInfo: {
          create: {
            assetName: metaData.name,
          },
        },
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function createIssuedAssetTransaction(
  event: Event,
  api: ApiPromise,
  blockNumber: number
) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, owner, totalSupply] = eventData as (Number | string)[];
    const metaData = await getMetadata(api, assetId as number);
    await prisma.assetTransaction.create({
      data: {
        sender: '', // our sudo standard account?
        recipient: owner as string,
        blockNumber: blockNumber,
        assetId: assetId as number,
        amount: totalSupply.toString(),
        assetInfo: {
          create: {
            assetName: metaData.name,
          },
        },
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (issued asset Transaction): ${e.message}`);
  }
}

export async function createTokenTransaction(
  event: Event,
  api: ApiPromise,
  blockNumber: number
) {
  try {
    let eventData = event.data.toJSON();
    let [currencyId, from, to, amount] = eventData as string[];
    let amountConverted = hexToBigInt(amount).toString();
    await prisma.$transaction([
      prisma.tokenTransaction.create({
        data: {
          sender: from as string,
          recipient: to as string,
          blockNumber: blockNumber,
          tokenId: currencyId as string,
          tokenName: '',
          amount: amountConverted,
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

async function getMetadata(api: ApiPromise, assetId: number) {
  let dataQuery = await api.query['assets']['metadata'](assetId);
  const metaDataArg = dataQuery.toHuman();
  let metaData = metaDataArg as unknown as MetaData;
  return metaData;
}

function getExchangeRate(currencyId: String): number {
  let exchangeRate = 1;
  switch (currencyId) {
    case 'USDT': {
      exchangeRate = 1.02; // here gecko coin api
      break;
    }
    case 'DOT': {
      exchangeRate = 6.28; // here gecko coin api
      break;
    }
  }
  return exchangeRate;
}

export async function queryBalances(
  api: ApiPromise,
  to: string,
  currencyId: string
) {
  //BBB Tokens Balance
  // let dataQuery = await api.query['system']['account'](to);
  // const { data: dataBBB } = dataQuery.toHuman() as unknown as Account;
  // console.log('data BBB', dataBBB);

  let dataQueryUSDT = await api.query['tokens']['accounts'](to, currencyId);
  const { free: balanceUSDT } =
    dataQueryUSDT.toHuman() as unknown as BalanceData;
  return [balanceUSDT];
}
