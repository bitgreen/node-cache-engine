
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';
import { convertHex } from './utils/converter';
import { Account, BalanceData } from './types/types';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}
// main function (must be async)
async function main() {

  console.log("test")
  // const id = 8;
  const api = await initApi();

  // let data  = await api.query["carbonCredits"]["projects"](id)
  // console.log(data.toJSON())
  // console.log(data.toHuman())

  // let [assetId, from, to, amount] = [12,"dfdjfdjf","5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7", 100]
  // console.log(assetId, from, to, amount);

  // //BBB Tokens Balance
  // let dataQuery = await api.query['system']['account'](to);
  // const {data:dataBBB} = (dataQuery.toHuman() as unknown) as Account;
  // console.log("data BBB", dataBBB);

  // let dataQueryUSDT = await api.query['tokens']['accounts'](to, "USDT");
  // const {free:balanceUSDT} = (dataQueryUSDT.toHuman() as unknown) as BalanceData;
  // console.log("balanceUSDT", balanceUSDT);

  // await prisma.assetTransaction.create({
  //     data:{
  //         sender    : from as string,
  //         recipient : to as string,
  //         assetId   : assetId as number,
  //         balance   : dataBBB.free,
  //         balanceUsd : balanceUSDT,
  //     }
  // })

  let [currencyId, from, to, amount] = ["USDT","dfdjfdjf","5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7", 100]
    console.log(currencyId, from, to, amount);

    //BBB Tokens Balance
    let dataQuery = await api.query['system']['account'](to);
    const {data:dataBBB} = (dataQuery.toHuman() as unknown) as Account;
    console.log("data BBB", dataBBB);

    let dataQueryUSDT = await api.query['tokens']['accounts'](to,currencyId );
    const {free:balanceUSDT} = (dataQueryUSDT.toHuman() as unknown) as BalanceData;
    console.log("balanceUSDT", balanceUSDT);
    await prisma.tokenTransaction.create({
        data:{
            sender    : from as string,
            recipient : to as string,
            tokencode: currencyId as string,
            balance   : dataBBB.free,
            balanceUsd : balanceUSDT,
        }
    })
}

main().catch(console.error);