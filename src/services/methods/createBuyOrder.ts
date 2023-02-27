import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import {
  CreditTransactionType,
} from '@prisma/client';

export async function createBuyOrder(event: Event, block_date: Date) {
  try {
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

    console.log(orderId, units, pricePerUnit, seller, buyer);

    // Seller and Buyer
    await prisma.$transaction([
      prisma.profil.update({
        where: {
          address: seller as string,
        },
        data: {
          investments: {
            update: {
              where: {
                addressProjectId: `${seller}_${projectId}`,
              },
              data: {
                // creditsOwned: {
                //   decrement: units as number,
                // },
                quantity: {
                  decrement: (units as number)
                },
                totalValue: {
                  decrement: ( pricePerUnit as number) * (units as number),
                },
                sellorders: {
                  update: {
                    where: {
                      orderId: orderId as number,
                    },
                    data: {
                      // isSold: sellOrder?.unitsRemain == units ? true : false,
                      unitsRemain: {
                        decrement: units as number,
                      },
                    },
                  },
                },
              },
            },
          },
          creditTransactions: {
            create: {
              type: CreditTransactionType.SALE,
              projectId: projectId as number,
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
              credits: units as number,
              creditPrice: pricePerUnit as number,
              from: seller as string,
              to: buyer as string,
              fee: feesPaid as number,
            },
          },
        },
      }),
      prisma.profil.update({
        where: {
          address: buyer as string,
        },
        data: {
          investments: {
            upsert: {
              where: { addressProjectId: `${buyer}_${projectId}` },
              update: {
                creditsOwned: {
                  increment: units as number,
                },
                totalValue: {
                  increment: ( pricePerUnit as number) * (units as number),
                },
                creditPrice: pricePerUnit as number,
                quantity: {
                  increment: (units as number)
                },
                creditsOwnedPerGroup: {
                  upsert: {
                    where: {
                      addressGroupId: `${buyer}_${groupId}_${projectId}`,
                    },
                    update: {
                      creditsOwned: {
                        increment: units as number,
                      },
                    },
                    create: {
                      groupId: groupId as number,
                      addressGroupId: `${buyer}_${groupId}`,
                      creditsOwned: units as number,
                    },
                  },
                },
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
                totalValue: ( pricePerUnit as number) * (units as number),
                addressProjectId: `${buyer}_${projectId}`,
                creditPrice: pricePerUnit as number ,
                quantity: units as number,
                creditsOwnedPerGroup: {
                  create: {
                    groupId: groupId as number,
                    addressGroupId: `${buyer}_${groupId}_${projectId}`,
                    creditsOwned: units as number,
                  },
                },
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
              projectId: projectId as number,
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
              credits: units as number,
              creditPrice: pricePerUnit as number,
              from: seller as string,
              to: buyer as string,
              fee: feesPaid as number,
            },
          },
        },
      }),
    ]);
   
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create buy order): ${e.message}`);

  }
}
