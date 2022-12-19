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

export async function processBlock(
  api: ApiPromise,
  blockNumber: BlockNumber | number
) {
  console.log(`Chain is at block: #${blockNumber}`);
  const { signedBlock, blockEvents } = await blockExtrinsic(api, blockNumber);
  if (!signedBlock || !blockEvents) return;

  const block_date = new Date();
  // parse block
  signedBlock.block.extrinsics.map(async (ex: Extrinsic, index: number) => {
    const isSigned = ex.isSigned;
    const hash = ex.hash.toString();
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
      .map(async ({ event }: EventRecord) => {
        if (!extrinsicSuccess) return;
        if (event.section === 'vcu') {
          if (event.method === BlockEvent.ProjectCreated) {
            createProject(ex, event, block_date);
          }
          if (event.method === BlockEvent.ProjectApproved) {
            approveProject(event, ProjectState.ACCEPTED, block_date);
          }
          if (event.method === BlockEvent.ProjectRejected) {
            approveProject(event, ProjectState.DECLINED, block_date);
          }
          if (event.method === BlockEvent.CarbonCreditMinted) {
            ccMinted(ex, block_date);
          }
        }
      });
  });

  console.log('-----------------------------------------------------');

  return true;
}
