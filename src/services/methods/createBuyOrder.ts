import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { ProjectState, SellOrder } from '@prisma/client';

export async function createBuyOrder(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let test = event.data.toJSON();
  let [orderId, units, pricePerUnit, seller, buyer] = test as (
    | Number
    | string
  )[];
  let projectId = 11; // later integrated in event ---------------------------------------------------- IMPORTANT STATIC FOR NOW
  console.log("event.data.toJSON()", test);
  console.log(orderId, units, pricePerUnit, seller, buyer);
  const profil = await prisma.profil.findUnique({
    where: {
      address: seller as string,
    },
    include: {
      investments: true,
    },
  });
  const investment = profil?.investments.find((i) => i.projectId === projectId);
  console.log('investment', investment);
  if (!investment?.creditsOwned) return;
  let diff =
    (investment?.creditsOwned as unknown as number) - (units as number);
  let crdOwn = diff < 0 ? 0 : diff;
  console.log('diff', diff);
  console.log('crdOwn', crdOwn);

  try {
    await prisma.profil.update({
      where: {
        address: seller as string,
      },
      data: {
        investments: {
          update: {
            where: {
              id: investment?.id,
            },
            data: {
              creditsOwned: crdOwn,
              sellorders: {
                update: {
                  where: {
                    orderId: orderId as number,
                  },
                  data: {
                    isSold: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    await prisma.profil.update({
        where: {
          address: buyer as string,
        },
        data: {
          investments: {
            create: {
              projectId: projectId,
              creditsOwned: units as number,
              retiredCredits: 0,
              creditPrice: pricePerUnit as number,
              quantity: 0,
              sellorders: undefined,
            },
          },
        },
      });
  } catch (e) {
    console.log(e);
  }


}
