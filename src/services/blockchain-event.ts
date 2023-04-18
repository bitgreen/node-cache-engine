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
import { updateBlock } from './methods/updateBlock';
import { createAssetTransaction, createIssuedAssetTransaction, createTokenTransaction } from './methods/createAssetsAndTokens';
import { sellOrderCancelled } from './methods/sellOrderCancelled';
import { updateProject } from './methods/updateProject';
import { updateBatchGroupInProject } from './methods/addBatchgroup';

export async function processBlock(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  console.log(`Processing block: #${blockNumber}`);
  const { signedBlock, blockEvents } = await blockExtrinsic(api, blockNumber);
  if (!signedBlock || !blockEvents) return;

  let blockDate: Date

  const extrinsics = signedBlock.block.extrinsics.toHuman()
  // @ts-ignore
  for(const extrinsic of extrinsics) {
    if(extrinsic.method.method === 'set' && extrinsic.method.section === 'timestamp') {
      blockDate = new Date(parseInt(extrinsic.method.args.now.replaceAll(/,/g, '')))
    }
  }

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
    blockEvents
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )
      .map(async ({ event }: EventRecord, i) => {
        if (!extrinsicSuccess) return;
        // if (api.events.system.ExtrinsicSuccess.is(event) == false) return;
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
            ccMinted(event, blockDate,api);
          }
          if (event.method === BlockEvent.CarbonCreditRetired) {
            console.log('retire tokens');
            await retireTokens(event, blockDate);
          }
          if (event.method === BlockEvent.ProjectUpdated) {
            console.log('UPDATE project');
            await updateProject(api,event, blockDate);
          }
          if (event.method === BlockEvent.BatchGroupAdded) {
            console.log('UPDATE batch groups');
            await updateBatchGroupInProject(api,event, blockDate);
          }
          // if (event.method === BlockEvent.ProjectResubmitted) {
          //   console.log('resubmit project');
          //   await resubmitProject(api,event, blockDate);
          // }
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
          if (event.method === BlockEvent.TransferAssets) {
            console.log('Asset called');
            createAssetTransaction(event, api,blockNumber as number);
          }
          if (event.method === BlockEvent.Issued) {
            console.log('Issued asset called');
            createIssuedAssetTransaction(event, api,blockNumber as number);
          }
        }
        if (event.section === 'tokens') {
          if (event.method === BlockEvent.TransferTokens) {
            console.log('tokens called');
            createTokenTransaction(event, api,blockNumber as number);
          }
        }
      });
  });

  console.log('-----------------------------------------------------');

  return true;
}
