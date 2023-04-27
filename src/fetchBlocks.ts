// Bitgreen block fetcher
// This program will process all blocks from X to Y
// and store them in a local Postgresql database.

import { Command } from 'commander';
import { processBlock } from './services/blockchain-event';
import { initApi } from './services/polkadot-api';

const program = new Command();

program
  .description('Bitgreen crawler to fetch custom blocks.')
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-bs, --block-start <value>', 'starting block number', '1')
  .option('-bt, --block-time <value>', 'block time', '500')
  .option(
    '-be, --block-end <value>',
    'ending block number - stop fetching at this block',
    false
  )
  .option('-a, --analyze-only', 'analyze only, dont crawl all data', false)
  // .option('--sleep', 'sleep', '500')
  .parse(process.argv);

program.parse();

const options = program.opts();

async function main() {
  const api = await initApi();
  const block_start = !isNaN(options.blockStart)
    ? parseInt(options.blockStart)
    : 1;
  const block_end =
    !isNaN(options.blockEnd) && parseInt(options.blockEnd) >= block_start
      ? parseInt(options.blockEnd)
      : 99999999999999;
  const block_time = !isNaN(options.blockTime)
      ? parseInt(options.blockTime)
      : 500;
  console.log("block sleep time:", block_time)
  console.log(`Blocks to fetch: ${block_start} to ${block_end}`);
  for (
    let block_number = block_start;
    block_number <= block_end;
    block_number++
  ) {
    const block_processed = await processBlock(api, block_number);
    await sleep(block_time);

    // if (!block_processed) {
    //   break;
    // }
  }
  process.exit(0)
}

function sleep(ms:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch(() => {
  console.error
  process.exit(1)
});
