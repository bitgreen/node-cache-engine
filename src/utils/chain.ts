import { initApi } from '../services/polkadot-api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const loadAccount = async () => {
  await cryptoWaitReady();

  const mnemonic = process.env.OWNER_MNEMONIC || '';
  const keyring = new Keyring({
    type: 'sr25519',
  });

  return keyring.addFromUri(mnemonic, { name: '' }, 'sr25519');
};

export async function submitExtrinsic(
  pallet: string,
  call: string,
  params: Array<string | number>
) {
  const polkadotApi = await initApi();

  const account = await loadAccount();

  if (!account) {
    return false;
  }
  let response = {};
  return new Promise(async (resolve) => {
    if (!polkadotApi.tx[pallet]) {
      response = {
        success: false,
        status: 'failed',
        error: 'Pallet not found.',
      };
      return resolve(response);
    }
    if (!polkadotApi.tx[pallet][call]) {
      response = {
        success: false,
        status: 'failed',
        error: 'Pallet call not found.',
      };
      return resolve(response);
    }
    await polkadotApi.tx[pallet][call](...params)
      .signAndSend(
        account,
        { nonce: -1 },
        ({ status, events = [], dispatchError }) => {
          if (dispatchError) {
            // for module errors, we have the section indexed, lookup
            const decoded = polkadotApi.registry.findMetaError(
              dispatchError.asModule
            );
            const { docs, method, section } = decoded;

            if (dispatchError.isModule) {
              response = {
                success: false,
                status: 'failed',
                error: docs.join(' '),
                data: {
                  section,
                  method,
                },
              };
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              response = {
                success: false,
                status: 'failed',
                error: dispatchError.toString(),
              };
            }

            resolve(response);
          }

          if (status.isInBlock) {
            // return result after confirmation
            resolve({
              success: true,
              data: {
                block_hash: status.asInBlock.toHex(),
              },
            });
          }
        }
      )
      .catch((err) => {
        resolve({
          success: false,
          status: 'failed',
          error: err.message,
        });
      });
  });
}
