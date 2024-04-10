// Bitgreen block crawler
// This program will listen for new blocks and store
// them in a local Postgresql database.

// import required dependencies
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';
import {updateAllProjects} from "@/services/update-projects";

// main function (must be async)
async function main() {
  const api = await initApi();

  // Retrieve the chain & node information via rpc calls
  const [block, chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.chain.getBlock(),
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  console.log('loading projects')
  await updateAllProjects(api)
  console.log('done loading projects')
  // return

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
    where: {
      fetchedAt: {
        gt: new Date(Number(process?.env?.INVALIDATION_TIMESTAMP) * 1000)
      }
    },
    select: {
      number: true,
    }
  });
  const fetchedBlocks = dbBlocks.map((row) => row.number);

  // Determine missing blocks
  const fetchedBlocksSet = new Set(fetchedBlocks);
  const missingBlocks = allBlocks.filter(id => !fetchedBlocksSet.has(id));

  // Process each missing block, in chunks of 800
  const activePromises = new Set();
  for(const blockNumber of missingBlocks) {
    // Wait if we reach the concurrency limit
    if (activePromises.size >= 800) {
      await Promise.race(activePromises);
    }

    const promise = processBlock(api, blockNumber).finally(() => {
      // Remove the promise from the set when it's settled
      activePromises.delete(promise);
    });

    // Add the new promise to the set
    activePromises.add(promise);
  }

  // Wait for all remaining promises to settle
  await Promise.all(activePromises);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

main().catch(console.error);
