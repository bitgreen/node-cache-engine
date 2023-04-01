
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { BalanceData } from '@/types/types';
import { hexToBigInt } from '@polkadot/util';

export async function createAssetTransaction(event: Event, api: ApiPromise,blockNumber: number) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, from, to, amount] = eventData as (Number | string)[];
    console.log(assetId, from, to, amount);
    await prisma.assetTransaction.create({
      data: {
        sender: from as string,
        recipient: to as string,
        blockNumber: blockNumber,
        assetId: assetId as number,
        amount: amount.toString()
      },
    })
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function createIssuedAssetTransaction(
  event: Event,
  api: ApiPromise,blockNumber: number
) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, owner, totalSupply] = eventData as (Number | string)[];
    console.log(assetId, owner, totalSupply);
    await prisma.assetTransaction.create({
      data: {
        sender: "", // our sudo standard account?
        recipient: owner as string,
        blockNumber: blockNumber,
        assetId: assetId as number,
        amount: totalSupply.toString()
      },
    })

  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (issued asset Transaction): ${e.message}`);
  }
}

export async function createTokenTransaction(event: Event, api: ApiPromise, blockNumber: number) {
  try {
    let eventData = event.data.toJSON();
    let [currencyId, from, to, amount] = eventData as (string)[];
    console.log(currencyId, from, to, amount);
    let amountConverted = hexToBigInt(amount).toString();
    console.log(amountConverted)
    await prisma.$transaction([
      prisma.tokenTransaction.create({
        data: {
          sender: from as string,
          recipient: to as string,
          blockNumber: blockNumber,
          tokenId: currencyId as string,
          tokenName: "",
          amount: amountConverted
        },
      })
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

function getExchangeRate(currencyId: String): number {
  let exchangeRate = 1;
  switch(currencyId) {
    case "USDT": {
      exchangeRate = 1.02 // here gecko coin api
      break;
    }
    case "DOT": {
      exchangeRate = 6.28 // here gecko coin api
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
