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

export async function createAssetTransaction(event: Event, api: ApiPromise) {
  try {
    let eventData = event.data.toJSON();
    let [assetId, from, to, amount] = eventData as (Number | string)[];
    console.log(assetId, from, to, amount);

    const [balanceBBB, balanceUSDT] = await queryBalances(api, to as string, "USDT")
    await prisma.assetTransaction.create({
      data: {
        sender: from as string,
        recipient: to as string,
        assetId: assetId as number,
        balance: balanceBBB,
        balanceUsd: balanceUSDT,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function createTokenTransaction(event: Event, api: ApiPromise) {
  try {
    let eventData = event.data.toJSON();
    let [currencyId, from, to, amount] = eventData as (Number | string)[];
    console.log(currencyId, from, to, amount);

    const [balanceBBB, balanceUSDT] = await queryBalances(api, to as string, currencyId as string)
    await prisma.tokenTransaction.create({
      data: {
        sender: from as string,
        recipient: to as string,
        tokencode: currencyId as string,
        balance: balanceBBB,
        balanceUsd: balanceUSDT,
      },
    });
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (asset Transaction): ${e.message}`);
  }
}

export async function queryBalances(api: ApiPromise, to: string, currencyId: string) {
    //BBB Tokens Balance
    let dataQuery = await api.query['system']['account'](to);
    const { data: dataBBB } = dataQuery.toHuman() as unknown as Account;
    console.log('data BBB', dataBBB);

    let dataQueryUSDT = await api.query['tokens']['accounts'](to, currencyId);
    const { free: balanceUSDT } = dataQueryUSDT.toHuman() as unknown as BalanceData;
    return [dataBBB.free,balanceUSDT ]

}
