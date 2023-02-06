import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';
import internal from 'stream';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}

export async function retireTokens(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let data = event.data.toJSON();
  console.log(event.data.toHuman());
  // [
  //   '26',
  //   '5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7',
  //   '100',
  //   [
  //     {
  //       name: '',
  //       uuid: '7cd2dd0a-8073-439c-880a-7a825e2275e6',
  //       issuanceYear: '2,023',
  //       count: '100'
  //     }
  //   ]
  // ]
  function updateBatch(
    projectId: number,
    assetId: number,
    retireData: RetireData
  ) {
    return prisma.project.update({
      where: { id: projectId },
      data: {
        batchGroups: {
          update: {
            where: { assetId: assetId },
            data: {
              batches: {
                updateMany: {
                  where: {
                    OR: [{ uuid: retireData.uuid }],
                  },
                  data: {},
                },
              },
            },
          },
        },
      },
    });
  }
  const assetId = 16; // ----------- later in the event, maybe now from the extrinsic. Am besten brauch ich hier die assetId oder die uuid der batchGruppe. sonst group id und dann von projecjts holen

  let [projectId, account, amount, retireData] = data as (
    | Number
    | string
    | RetireData[]
  )[];
  let retireData2 = retireData as RetireData[];
  let updates = retireData2.map((retireData) => {
    return updateBatch(projectId as number, assetId, retireData);
  });

  console.log(projectId, account, amount, retireData);
  await prisma.$transaction(updates);

  // here update investements
}
