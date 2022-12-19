import { ApiPromise } from '@polkadot/api';
import {
  BlockNumber,
  BlockHash,
  EventRecord,
} from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types-codec';

export async function blockExtrinsic(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  const blockHash = (await api.rpc.chain.getBlockHash(
    blockNumber
  )) as BlockHash;
  const apiAt = await api.at(blockHash);
  try {
    let [signedBlock, blockEvents] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      apiAt.query.system.events() as Promise<Vec<EventRecord>>,
    ]);
    return { signedBlock: signedBlock, blockEvents: blockEvents };
  } catch (error) {
    return {};
  }
}
