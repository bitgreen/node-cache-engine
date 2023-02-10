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


  // Seller

  try {
    await prisma.profil.update({
      where: {
        address: seller as string,
      },
      data: {
        investments: {
          update: {
            where: {
              addressProjectId:`${seller}_${projectId}`,
            },
            data: {
              creditsOwned: {
                decrement: units as number
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
              creditsOwnedPerGroup: {
                update: {
                  where:{addressGroupId: `${seller}_${groupId}_${projectId}`,},
                  data:{
                    creditsOwned: {
                      decrement: units as number,
                    },
                  },
                }
              }
              // buyOrders: buyOrderParams,
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
            fee: feesPaid as number,
          },
        },
      },
    });
    // BUYER
    // Todo: solve over increment
    // const investmentBuyer = profil
    //   ?.find((p) => p.address === buyer)
    //   ?.investments.find((i) => i.projectId === projectId);
    // console.log('investmentBuyer', investmentBuyer);
    // console.log('id', investmentBuyer?.id);

    // const unitSum =
    //   (units as number) +
    //   (investmentBuyer?.creditsOwned
    //     ? (investmentBuyer?.creditsOwned as unknown as number)
    //     : 0);
    await prisma.profil.update({
      where: {
        address: buyer as string,
      },
      data: {
        investments: {
          upsert: {
            where: { addressProjectId:`${buyer}_${projectId}`},
            update: {
              creditsOwned: {
                increment: units as number,
              },
              creditsOwnedPerGroup: {
                upsert: {
                  where: {addressGroupId: `${buyer}_${groupId}_${projectId}` },
                  update: {
                    creditsOwned: {
                      increment: units as number,
                    }
                  },
                  create:{
                    groupId: groupId as number,
                    addressGroupId: `${buyer}_${groupId}`,
                    creditsOwned: units as number,
                  },                  
                }
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
              addressProjectId:`${buyer}_${projectId}`,
              creditPrice: pricePerUnit as number,
              quantity: 0,
              creditsOwnedPerGroup: {
                create:{
                  groupId: groupId as number,
                  addressGroupId: `${buyer}_${groupId}_${projectId}`,
                  creditsOwned: units as number,
                }
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
    });
  } catch (e) {
    console.log(e);
  }
}
