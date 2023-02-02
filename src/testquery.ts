
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';

// main function (must be async)
async function main() {

  console.log("test")
  const id = 8;
  const api = await initApi();

  let data  = await api.query["carbonCredits"]["projects"](id)
  console.log(data.toJSON())
  console.log(data.toHuman())


}

main().catch(console.error);