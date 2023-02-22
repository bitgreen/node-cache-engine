
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';
import { convertHex } from './utils/converter';
import { Account, BalanceData } from './types/types';
import { ApiPromise } from '@polkadot/api';
import axios from 'axios';

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
  try {
    
    let [currencyId, from, to, amount] = ["DOT", "5CJpxdAFyLd1YhGBmC7FToe2SWrtR6UvGZcqpjKbxYUhRjWx", "5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7", 100]
    console.log(currencyId, from, to, amount);

    let [balanceBBB, balanceUSDT] = await queryBalances(api, to as string, currencyId as string)
    if (currencyId == "DOT") {
      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=USD")
      const data = response.data
      balanceUSDT = data.polkadot.usd.toString();
      console.log("polkadot in usd", balanceUSDT)
    }
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


async function queryBalances(api: ApiPromise, to: string, currencyId: string) {
    //BBB Tokens Balance
    let dataQuery = await api.query['system']['account'](to);
    const { data: dataBBB } = dataQuery.toHuman() as unknown as Account;
    console.log('data BBB', dataBBB);

    let dataQueryUSDT = await api.query['tokens']['accounts'](to, currencyId);
    const { free: balanceUSDT } = dataQueryUSDT.toHuman() as unknown as BalanceData;
    return [dataBBB.free,balanceUSDT ]

}

main().catch(console.error);