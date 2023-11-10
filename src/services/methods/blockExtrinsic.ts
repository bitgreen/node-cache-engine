import { ApiPromise } from '@polkadot/api';
import {
  BlockNumber,
  BlockHash,
  EventRecord,
} from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types-codec';
import {SignedBlock} from "@polkadot/types/interfaces/runtime/types";

export async function blockExtrinsic(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  try {
    const blockHash = (await api.rpc.chain.getBlockHash(
      blockNumber
    )) as BlockHash;
    const apiAt = await api.at(blockHash);

    let [signedBlock, blockEvents] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      apiAt.query.system.events() as Promise<Vec<EventRecord>>,
    ]);

    const blockDate = await getBlockDate(api, signedBlock)

    return { signedBlock: signedBlock, blockEvents: blockEvents, blockDate };
  } catch (error) {
    return {};
  }
}

export async function getBlockDate(api: ApiPromise, signedBlock: SignedBlock) {
  const blockTimestamp = signedBlock!.block.extrinsics.find(
      (extrinsic) => extrinsic.method.section === 'timestamp' && extrinsic.method.method === 'set'
  );

  return new Date(Number(blockTimestamp!.method.args[0].toString()))
}