// We would need the possibility to query the assets by account and get back a json ordered by name for example:
// [{
//     assetid:xxx,
//     assetname:xxxxx, (it may be the project description)
//     assetdatecreation:xxxx-xx-xxx, (for carbon credit only)
//     assetlogo:<inline svg>,
//     nftimage: url,
//     balance: xxxxx,
//     balanceusd: xxxxxx (exchanged from coingeko where available),
// },
// {..}]
// We would need the possibility to query the tokens by account and get back a json ordered by name for example:
// [{
//     tokenid:xxx,
//     tokencode:xxxx USDT
//     tokenname:xxxxx, (it may be the project description)
//     tokenlogo:<inline svg>,
//     balance: xxxxx,
//     balanceusd: xxxxxx (exchanged from coingeko where available),
// },
// {..}]
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { Account, BalanceData } from '@/types/types';
import axios from 'axios';

export async function createAssetTransaction(event: Event, api: ApiPromise) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, from, to, amount] = eventData as (Number | string)[];
    console.log(assetId, from, to, amount);
    let [balanceBBBTo, balanceUSDTTo] = await queryBalances(
      api,
      to as string,
      'USDT'
    );
    let [balanceBBBFrom, balanceUSDTFrom] = await queryBalances(
      api,
      from as string,
      'USDT'
    );

    await prisma.$transaction([
      prisma.assetTransaction.upsert({
        where: {
          account_assetId: {
            account: to as string,
            assetId: assetId as number,
          },
        },
        update: {
          balance: balanceBBBTo,
          balanceUsd: balanceUSDTTo,
        },
        create: {
          account: to as string,
          assetId: assetId as number,
          balance: balanceBBBTo,
          balanceUsd: balanceUSDTTo,
        },
      }),
      prisma.assetTransaction.upsert({
        where: {
          account_assetId: {
            account: from as string,
            assetId: assetId as number,
          },
        },
        update: {
          balance: balanceBBBFrom,
          balanceUsd: balanceUSDTFrom,
        },
        create: {
          account: from as string,
          assetId: assetId as number,
          balance: balanceBBBFrom,
          balanceUsd: balanceUSDTFrom,
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function createIssuedAssetTransaction(
  event: Event,
  api: ApiPromise
) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, owner, totalSupply] = eventData as (Number | string)[];
    console.log(assetId, owner, totalSupply);

    const [balanceBBB, balanceUSDT] = await queryBalances(
      api,
      owner as string,
      'USDT'
    );
    await prisma.assetTransaction.upsert({
      where: {
        account_assetId: {
          account: owner as string,
          assetId: assetId as number,
        },
      },
      update: {
        balance: balanceBBB,
        balanceUsd: balanceUSDT,
      },
      create: {
        account: owner as string,
        assetId: assetId as number,
        balance: balanceBBB,
        balanceUsd: balanceUSDT,
      },
    })
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (issued asset Transaction): ${e.message}`);
  }
}

export async function createTokenTransaction(event: Event, api: ApiPromise) {
  try {
    let eventData = event.data.toJSON();
    let [currencyId, from, to, amount] = eventData as (Number | string)[];
    console.log(currencyId, from, to, amount);

    let [balanceBBBTo, balanceUSDTTo] = await queryBalances(
      api,
      to as string,
      currencyId as string
    );
    let [balanceBBBFrom, balanceUSDTFrom] = await queryBalances(
      api,
      from as string,
      currencyId as string
    );
    if (currencyId == 'DOT') {
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=USD'
        );
        const data = response.data;
        balanceUSDTTo = (
          Number(balanceUSDTTo) * (data.polkadot.usd as number)
        ).toString();
        console.log('polkadot in usd', balanceUSDTTo);
        balanceUSDTFrom = (
          Number(balanceUSDTFrom) * (data.polkadot.usd as number)
        ).toString();
        console.log('polkadot in usd', balanceUSDTFrom);
      } catch (e:any) {
        //@ts-ignore
        console.log(
          `Error occurred (asset Transaction) gecko api: ${e.message}`
        );
      }
    }
    await prisma.$transaction([
      prisma.tokenTransaction.upsert({
        where: { account: to as string },
        update: {
          balance: balanceBBBTo,
          balanceUsd: balanceUSDTTo,
        },
        create: {
          account: to as string,
          tokencode: currencyId as string,
          balance: balanceBBBTo,
          balanceUsd: balanceUSDTTo,
        },
      }),
      prisma.tokenTransaction.upsert({
        where: { account: from as string },
        update: {
          balance: balanceBBBFrom,
          balanceUsd: balanceUSDTFrom,
        },
        create: {
          account: from as string,
          tokencode: currencyId as string,
          balance: balanceBBBFrom,
          balanceUsd: balanceUSDTFrom,
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function queryBalances(
  api: ApiPromise,
  to: string,
  currencyId: string
) {
  //BBB Tokens Balance
  let dataQuery = await api.query['system']['account'](to);
  const { data: dataBBB } = dataQuery.toHuman() as unknown as Account;
  console.log('data BBB', dataBBB);

  let dataQueryUSDT = await api.query['tokens']['accounts'](to, currencyId);
  const { free: balanceUSDT } =
    dataQueryUSDT.toHuman() as unknown as BalanceData;
  return [dataBBB.free, balanceUSDT];
}
