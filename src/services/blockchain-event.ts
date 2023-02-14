import { BlockEvent } from '../types/types';
import 'dotenv/config';
import { ProjectState } from '@prisma/client';
import { ApiPromise } from '@polkadot/api';
import {
  BlockNumber,
  Extrinsic,
  EventRecord,
} from '@polkadot/types/interfaces';
import { createProject } from './methods/createProject';
import { approveProject } from './methods/approveProject';
import { ccMinted } from './methods/mintedCarbonCredit';
import { blockExtrinsic } from './methods/blockExtrinsic';
import { transaction } from './methods/transaction';
import { rejectProject } from './methods/rejectProject';
import { createSellOrder } from './methods/createSellOrder';
import { createBuyOrder } from './methods/createBuyOrder';
import { retireTokens } from './methods/retireTokens';
import { updateBlockNumber } from './methods/updateBlockNumber';
import { createAssetTransaction, createTokenTransaction } from './methods/createAssetsAndTokens';
import { sellOrderCancelled } from './methods/sellOrderCancelled';

export async function processBlock(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  console.log(`Chain is at block: #${blockNumber}`);
  const { signedBlock, blockEvents } = await blockExtrinsic(api, blockNumber);
  if (!signedBlock || !blockEvents) return;

  const blockDate = new Date();
  // parse block
  signedBlock.block.extrinsics.map(async (ex: Extrinsic, index: number) => {
    const isSigned = ex.isSigned;
    const hash = ex.hash.toString();
    updateBlockNumber(blockNumber as number, hash);
    let extrinsicSuccess = false,
      newAssetId: number | undefined;

    let signed_by_address: string | undefined;
    if (isSigned) {
      signed_by_address = ex.signer.toString();
    }
    blockEvents
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )
      .map(async ({ event }: EventRecord) => {
        extrinsicSuccess = !!api.events.system.ExtrinsicSuccess.is(event);
      });
    // Start processing extrinsic and it's data
    blockEvents
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )
      .map(async ({ event }: EventRecord, i) => {
        if (!extrinsicSuccess) return;
        console.log('event.section', event.section);
        console.log('method', event.method);
        if (event.section === 'carbonCredits') {
          if (event.method === BlockEvent.ProjectCreated) {
            createProject(api, event, blockDate);
          }
          if (event.method === BlockEvent.ProjectApproved) {
            approveProject(event, blockDate);
          }
          if (event.method === BlockEvent.ProjectRejected) {
            rejectProject(event, blockDate);
          }
          if (event.method === BlockEvent.CarbonCreditMinted) {
            ccMinted(ex, blockDate,api);
          }
          if (event.method === BlockEvent.CarbonCreditRetired) {
            console.log('retire tokens');
            await retireTokens(event, blockDate);
          }
        }
        if (event.section === 'balances') {
          if (event.method === BlockEvent.Transfer) {
            transaction(event, blockNumber as number, blockDate, hash + i);
          }
        }
        if (event.section === 'dex') {
          if (event.method === BlockEvent.SellOrderCreated) {
            console.log('sell order created');
            createSellOrder(event, blockDate);
          }
          if (event.method === BlockEvent.SellOrderCancelled) {
            console.log('sell order cancelled');
            sellOrderCancelled(event);
          }
          if (event.method === BlockEvent.BuyOrderFilled) {
            console.log('buy order created');
            createBuyOrder(event, blockDate);
          }
        }
        if (event.section === 'assets') {
          if (event.method === BlockEvent.TransderAssets) {
            console.log('Asset called');
            createAssetTransaction(event, api);
          }
        }
        if (event.section === 'tokens') {
          if (event.method === BlockEvent.TransferTokens) {
            console.log('tokens called');
            createTokenTransaction(event, api);
          }
        }
      });
  });

  console.log('-----------------------------------------------------');

  return true;
}
