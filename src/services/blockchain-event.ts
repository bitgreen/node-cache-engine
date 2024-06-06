import { BlockEvent } from '../types/types';
import 'dotenv/config';
import { ProjectState } from '@prisma/client';
import { ApiPromise } from '@polkadot/api';
import {
  BlockNumber,
  Extrinsic,
  EventRecord,
} from '@polkadot/types/interfaces';
import { approveProject } from '@/services/methods/approveProject';
import {blockExtrinsic, getBlockDate} from '@/services/methods/blockExtrinsic';
import { transaction } from '@/services/methods/transaction';
import { rejectProject } from '@/services/methods/rejectProject';
import { createSellOrder } from '@/services/methods/createSellOrder';
import { createBuyOrder, createTrade } from '@/services/methods/createBuyOrder';
import { createRetiredAssetTransaction } from '@/services/methods/retireTokens';
import { updateBlock } from '@/services/methods/updateBlock';
import {
  createIssuedAssetTransaction, createSellOrderAssetTransaction,
  createTokenTransaction,
  createTransferAssetTransaction,
} from '@/services/methods/createAssetsAndTokens';
import { sellOrderCancelled } from '@/services/methods/sellOrderCancelled';
import { memberAddedKYC } from '@/services/methods/memberAddedKYC';
import {createOrUpdateProject, refreshProjectData, updateProjectData} from "@/services/methods/createOrUpdateProject";

export async function processBlock(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  console.log(`Processing block: #${blockNumber}`);

  const { signedBlock, blockEvents, blockDate, blockHash } = await blockExtrinsic(api, blockNumber);

  if (!signedBlock || !blockEvents) return;

  let index = 0

  // parse block
  for (const [exIndex, ex] of signedBlock.block.extrinsics.entries()) {
    const isSigned = ex.isSigned;
    const hash = ex.hash.toString();

    let signed_by_address: string | undefined;
    if (isSigned) {
      signed_by_address = ex.signer.toString();
    }

    const extrinsicSuccess = blockEvents
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(exIndex)
      )
      // @ts-ignore
      .some(({ event }) => !!api.events.system.ExtrinsicSuccess.is(event))

    if(exIndex === 0) {
      // Do system events
      const sysEvents = blockEvents
          .filter(
              ({ phase }: EventRecord) => !phase.isApplyExtrinsic
          )

      index = sysEvents.length
    }

    // Start processing extrinsic and it's data
    const exEvents = blockEvents
      .filter(
        ({ phase }: EventRecord) => {
          // console.log('phase', phase.isApplyExtrinsic)
          // console.log('phase', phase.asApplyExtrinsic)
          // return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(exIndex)
          return phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(exIndex)
        }
      )

    for(const {event} of exEvents) {
      if (!extrinsicSuccess) return;
      // if (api.events.system.ExtrinsicSuccess.is(event) == false) return;
      // console.log('event.section', event.section);
      // console.log('event.method', event.method);

      if (event.section === 'carbonCredits') {
        if (event.method === BlockEvent.ProjectCreated || event.method === BlockEvent.ProjectUpdated) {
          await createOrUpdateProject(blockNumber, api, event, blockDate);
        }

        if (event.method === BlockEvent.ProjectApproved) {
          await approveProject(event, blockDate);
        }

        if (event.method === BlockEvent.ProjectRejected) {
          await rejectProject(blockNumber, event, blockDate);
        }

        if (event.method === BlockEvent.CarbonCreditMinted) {
          const eventData = event.toHuman()
          const projectId = parseInt(eventData.projectId as string)
          await refreshProjectData(projectId, api)
        }

        if (event.method === BlockEvent.CarbonCreditRetired) {
          console.log('retire tokens');
          await createRetiredAssetTransaction(
              event,
              blockNumber as number,
              index,
              blockDate,
              hash + index
          );
        }
      }
      if (event.section === 'assets') {
        if (event.method === BlockEvent.Created || event.method === BlockEvent.ForceCreated) {
          console.log('Asset created');
        }
        if (event.method === BlockEvent.TransferAssets) {
          console.log('Asset called');
          await createTransferAssetTransaction(
              event,
              blockNumber as number,
              index,
              blockDate,
              hash
          );
        }
        if (event.method === BlockEvent.Issued) {
          console.log('Issued asset called');
          await createIssuedAssetTransaction(
              event,
              blockNumber as number,
              index,
              blockDate,
              hash + index
          );
        }
      }
      if (event.section === 'balances') {
        if (event.method === BlockEvent.Transfer) {
          await transaction(
            event,
            blockNumber as number,
            blockDate,
            hash + exIndex
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
            index,
            blockDate,
            hash
          );
        }
        if (event.method === BlockEvent.SellOrderCancelled) {
          console.log('sell order cancelled');
          await sellOrderCancelled(api, event, blockNumber as number, index, hash);
        }
        if (event.method === BlockEvent.BuyOrderFilled) {
          console.log('buy order filled');
          await createTrade(api, event, blockDate, blockNumber as number, index, hash);

          await createBuyOrder(event, blockDate, blockNumber);
        }
      }
      if (event.section === 'tokens') {
        if (event.method === BlockEvent.TransferTokens || event.method === BlockEvent.BalanceSet) {
          console.log('tokens called');
          await createTokenTransaction(
              event,
              api,
              blockNumber as number,
              blockDate,
              hash + exIndex
          );
        }
      }
      if (event.section === 'kyc') {
        if (event.method === BlockEvent.MemberAdded) {
          console.log('member added kyc');
          memberAddedKYC(event, blockDate);
        }
      }

      index++
    }
  }

  await updateBlock(blockNumber as number, blockHash.toHex(), blockDate);

  console.log('-----------------------------------------------------');

  return true;
}
