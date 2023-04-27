// Bitgreen block crawler
// This program will listen for new blocks and store
// them in a local Postgresql database.

// import required dependencies
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from "./services/prisma";

// main function (must be async)
async function main() {

  // schedule("*/15 * * * *",() => {
  //   fetchExchangeRate()
  //   console.log("---------------------");
  //   console.log("Cron job for exchange rate executed");
  // })

  const api = await initApi();

  // Retrieve the chain & node information via rpc calls
  const [block, chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.chain.getBlock(),
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

  // We only display a couple, then unsubscribe
  let count = 0;

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(
      async (header: Header) => {
        await processBlock(api, header.number.toNumber());

        // if (++count === 20) {
        // 	unsubscribe();
        // 	process.exit(0);
        // }
      }
  );

  // Get current block
  const currentBlock = block.block.header.number.toNumber()
  // Get all blocks up to current block
  const allBlocks = Array.from({ length: currentBlock }, (_, i) => i + 1);

  // Get fetched blocks
  const dbBlocks = await prisma.block.findMany({
    select: {
      number: true,
    },
  });
  const fetchedBlocks = dbBlocks.map((row) => row.number);

  // Determine missing blocks
  const missingBlocks = allBlocks.filter((id) => !fetchedBlocks.includes(id));

  let chunk = []

  // Process each missing block, in chunks of 100, 1s delay per chunk
  for(const blockNumber of missingBlocks) {
    chunk.push(blockNumber);
    if (chunk.length === 100) {
      chunk.map(async (blockNumber) => {
        await processBlock(api, blockNumber)
      })

      await sleep(1000)

      chunk = [];
    }
  }

  // Process last chunk
  if (chunk.length > 0) {
    chunk.map(async (blockNumber) => {
      await processBlock(api, blockNumber)
    })
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

main().catch(console.error);
