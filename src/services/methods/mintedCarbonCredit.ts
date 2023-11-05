import { ApiPromise } from '@polkadot/api';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Extrinsic, Event } from '@polkadot/types/interfaces';
import { queryBalances } from './createAssetsAndTokens';
import { CreditTransactionType } from '@prisma/client';
import { CarbonCreditTransactionType } from '@prisma/client';

export async function ccMinted(
  event: Event,
  updatedAt: Date,
  api: ApiPromise
) {
  try {
    let data = event.data.toJSON();
    let [projectId, groupId, recipient, amount] = data as (Number | string)[];

    console.log('Carbon credits minted', projectId, groupId, recipient, amount);

    const projectArgs = await prisma.project.findUnique({
      include: {
        batchGroups: true,
      },
      where: {
        id: projectId as number,
      },
    });
    if (!projectArgs) return;
    // console.log(
    //   'TEST',
    //   projectArgs?.batchGroups.find((bg) => bg.groupId == groupId)
    // );
    // console.log(
    //   'TEST2',
    //   projectArgs?.batchGroups.find((bg) => bg.groupId == groupId)?.id
    // );
    await prisma.creditTransaction.create({
      data: {
        type: CreditTransactionType.ISSUED,
        projectId: projectId as number,
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
        credits: amount as number,
        creditPrice: 0,
        owner: recipient as string,
        from: '',
        to: recipient as string,
        fee: 0,
        createdAt: updatedAt.toISOString(),
      }
    })
    // const [balanceBBB, balanceUSDT] = await queryBalances(
    //   api,
    //   recipient as string,
    //   'USDT'
    // );

    // await prisma.assetTransaction.create({
    //   data: {
    //     sender: '',
    //     recipient: recipient as string,
    //     assetId: projectArgs?.batchGroups[groupId as number].assetId as number,
    //     balance: balanceBBB,
    //     balanceUsd: balanceUSDT,
    //   },
    // });

    await prisma.carbonCreditAssetTransaction.create({
      data: {
        type: CarbonCreditTransactionType.ISSUED,
        projectId: projectId as number,
        credits: amount as number,
        pricePerUnit: 0,
        from: "",
        to: recipient as string,
        fee: 0,
        createdAt: updatedAt.toISOString(),
      }
    });

  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (minting carbon credit): ${e.message}`);
  }
}
