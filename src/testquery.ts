
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
}



main().catch(console.error);