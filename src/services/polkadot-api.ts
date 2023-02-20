import { WsProvider, ApiPromise } from '@polkadot/api';
import { ProviderInterface } from '@polkadot/rpc-provider/types';
import { ApiOptions } from '@polkadot/api/types';

import types from '../assets/types.json';
import rpc from '../assets/rpc.json';
let api: ApiPromise;

export async function initApi() {
  // Initialise the provider to connect to the local node
  if (api) return api;
  const provider = new WsProvider(
    process.env.RPC_PROVIDER
  ) as ProviderInterface;
  // Create the API and wait until ready
  api = await ApiPromise.create({
    provider: provider,
    types: types,
    rpc: rpc,
  } as ApiOptions);
  await api.isReady;
  
  return api;
}
