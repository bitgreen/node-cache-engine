import { BlockEvent } from '../types/types';
import 'dotenv/config';
import { ProjectState } from '@prisma/client';
import { ApiPromise } from '@polkadot/api';
import {
  BlockNumber,
  Extrinsic,
  EventRecord,
} from '@polkadot/types/interfaces';
import { approveProject } from './methods/approveProject';
import { ccMinted } from './methods/mintedCarbonCredit';
import {blockExtrinsic, getBlockDate} from './methods/blockExtrinsic';
import { transaction } from './methods/transaction';
import { rejectProject } from './methods/rejectProject';
import { createSellOrder } from './methods/createSellOrder';
import { createBuyOrder, createTrade } from './methods/createBuyOrder';
import { createRetiredAssetTransaction } from './methods/retireTokens';
import { updateBlock } from './methods/updateBlock';
import {
  createIssuedAssetTransaction, createSellOrderAssetTransaction,
  createTokenTransaction,
  createTransferAssetTransaction,
} from './methods/createAssetsAndTokens';
import { sellOrderCancelled } from './methods/sellOrderCancelled';
import { memberAddedKYC } from './methods/memberAddedKYC';

export async function processBlock(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  console.log(`Processing block: #${blockNumber}`);
  const { signedBlock, blockEvents, blockDate } = await blockExtrinsic(api, blockNumber);

  if (!signedBlock || !blockEvents) return;

  // parse block
  signedBlock.block.extrinsics.map(async (ex: Extrinsic, index: number) => {
    const isSigned = ex.isSigned;
    const hash = ex.hash.toString();

    await updateBlock(blockNumber as number, hash, blockDate);

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
    const allEvents = blockEvents
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )

    let i = 0
    for(const {event} of allEvents) {
      if (!extrinsicSuccess) return;
      // if (api.events.system.ExtrinsicSuccess.is(event) == false) return;
      console.log('event.section', event.section);
      console.log('method', event.method);
      if (event.section === 'assets') {
        if (event.method === BlockEvent.TransferAssets) {
          console.log('Asset called');
          await createTransferAssetTransaction(
              event,
              blockNumber as number,
              blockDate,
              hash
          );
        }
        if (event.method === BlockEvent.Issued) {
          console.log('Issued asset called');
          await createIssuedAssetTransaction(
              event,
              blockNumber as number,
              blockDate,
              hash
          );
        }
      }
      if (event.section === 'balances') {
        if (event.method === BlockEvent.Transfer) {
          await transaction(
            event,
            blockNumber as number,
            blockDate,
            hash + i
          );
        }
      }
      if (event.section === 'dex') {
        if (event.method === BlockEvent.SellOrderCreated) {
          console.log('sell order created');
          // await createSellOrder(event, blockDate, blockNumber);
          await createSellOrderAssetTransaction(
            event,
            blockNumber as number,
            blockDate,
            hash
          );
        }
        if (event.method === BlockEvent.SellOrderCancelled) {
          console.log('sell order cancelled');
          await sellOrderCancelled(event, hash);
        }
        if (event.method === BlockEvent.BuyOrderFilled) {
          console.log('buy order filled');
          await createBuyOrder(event, blockDate, blockNumber);
          await createTrade(event, blockDate, blockNumber as number, hash);
        }
        // if (event.method === BlockEvent.BuyOrderCreated) {
        //   console.log('buy order created');
        //   await reserveBuyOrder(event, blockDate);
        // }
      }
      if (event.section === 'carbonCredits') {
        if (event.method === BlockEvent.ProjectApproved) {
          await approveProject(event, blockDate);
        }
        if (event.method === BlockEvent.ProjectRejected) {
          await rejectProject(event, blockDate);
        }
        if (event.method === BlockEvent.CarbonCreditMinted) {
          await ccMinted(
              event,
              blockNumber as number,
              blockDate,
              hash
          );
        }
        if (event.method === BlockEvent.CarbonCreditRetired) {
          console.log('retire tokens');
          await createRetiredAssetTransaction(
            event,
            blockNumber as number,
            blockDate,
              (ex.method.section === 'utility' && ex.method.method === 'batch') ? hash + i : hash
          );
        }
      }
      if (event.section === 'tokens') {
        // TODO: Consider adding tokens.balanceSet
        if (event.method === BlockEvent.TransferTokens) {
          console.log('tokens called');
          await createTokenTransaction(
              event,
              api,
              blockNumber as number,
              blockDate,
              hash + i
          );
        }
      }
      if (event.section === 'kyc') {
        if (event.method === BlockEvent.MemberAdded) {
          console.log('member added kyc');
          memberAddedKYC(event, blockDate);
        }
      }

      i++
    }
  });

  console.log('-----------------------------------------------------');

  return true;
}
