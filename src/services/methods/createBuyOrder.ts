import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {
  CreditTransactionType,
  Investment,
  Prisma,
  ProjectState,
  SellOrder,
} from '@prisma/client';

export async function createBuyOrder(event: Event, block_date: Date) {
  //[orderId, assetId, units, pricePerUnit, owner]
  let dataBlock = event.data.toJSON();
  let [
    orderId,
    units,
    projectId,
    groupId,
    pricePerUnit,
    feesPaid,
    seller,
    buyer,
  ] = dataBlock as (Number | string)[];
  console.log('event.data.toJSON()', dataBlock);
  console.log(orderId, units, pricePerUnit, seller, buyer);
  const profil = await prisma.profil.findMany({
    where: {
      OR: [{ address: seller as string }, { address: buyer as string }],
    },
    include: {
      investments: { include: { sellorders: true } },
    },
  });
  const investment = profil
    ?.find((p) => p.address === seller)
    ?.investments.find((i) => i.projectId === projectId);
  console.log('investment', investment);
  if (!investment?.creditsOwned) return;
  let diff =
    (investment?.creditsOwned as unknown as number) - (units as number);
  let crdOwn = diff < 0 ? 0 : diff;
  const sellOrder = investment?.sellorders.find((sl) => sl.orderId === orderId);
  if (!sellOrder) return;
  const newUnitsRemain = sellOrder.unitsRemain - (units as number);
  console.log('diff', diff);
  console.log('crdOwn', crdOwn);
  console.log('newUnitsRemain', newUnitsRemain);

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
                    isSold: sellOrder?.unitsRemain == units ? true : false,
                    unitsRemain: newUnitsRemain,
                  },
                },
              },
            },
          },
        },
        creditTransactions: {
          create: {
            type: CreditTransactionType.SALE,
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
            credits: units as number,
            creditPrice: pricePerUnit as number,
            from: seller as string,
            to: buyer as string,
            fee: feesPaid as number
          },
        },
      },
    });
    // BUYER
    const investmentBuyer = profil
      ?.find((p) => p.address === buyer)
      ?.investments.find((i) => i.projectId === projectId);
    console.log('investmentBuyer', investmentBuyer);
    console.log('id', investmentBuyer?.id);

    const unitSum =
      (units as number) +
      (investmentBuyer?.creditsOwned
        ? (investmentBuyer?.creditsOwned as unknown as number)
        : 0);
    await prisma.profil.update({
      where: {
        address: buyer as string,
      },
      data: {
        investments: {
          upsert: {
            where: { id: investmentBuyer?.id ? investmentBuyer?.id : 'uzhgg' },
            update: {
              creditsOwned: unitSum,
              buyOrders: {
                create: {
                  creditsOwned: units as number,
                  retiredCredits: 0,
                  creditPrice: pricePerUnit as number,
                  orderId: orderId as number,
                  groupId: groupId as number,
                },
              },
            },
            create: {
              projectId: projectId as number,
              creditsOwned: units as number,
              retiredCredits: 0,
              creditPrice: pricePerUnit as number,
              quantity: 0,
              buyOrders: {
                create: {
                  creditsOwned: units as number,
                  retiredCredits: 0,
                  creditPrice: pricePerUnit as number,
                  orderId: orderId as number,
                  groupId: groupId as number,
                },
              },
              sellorders: undefined,
            },
          },
        },
        creditTransactions: {
          create: {
            type: CreditTransactionType.PURCHASE,
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
            credits: units as number,
            creditPrice: pricePerUnit as number,
            from: seller as string,
            to: buyer as string,
            fee: feesPaid as number
          },
        },
      },
    });
  } catch (e) {
    console.log(e);
  }
}
