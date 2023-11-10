import { hexToString } from '@polkadot/util';

function isHex(h: string) {
  return Boolean(h.match(/^0x[0-9a-f]+$/i));
}

export function convertHex(val: string) {
  // console.log(val);
  // console.log(isHex(val));
  return isHex(val) ? hexToString(val) : val === '0x' ? '' : val;
}

export const DIVIDER = 1000000
