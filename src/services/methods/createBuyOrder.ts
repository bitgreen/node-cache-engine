import { hexToString } from '@polkadot/util';
import { Codec } from '@polkadot/types-codec/types';
import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';
import { CreditTransactionType } from '@prisma/client';

export async function createBuyOrder(event: Event, createdAt: Date) {
  try {
    let dataBlock = event.data.toHuman();
    let [
      orderIdChain,
      sellOrderIdChain,
      unitsChain,
      projectIdChain,
      groupIdChain,
      pricePerUnit,
      feesPaidChain,
      seller,
      buyer,
    ] = dataBlock as string[];
    const orderId = Number(orderIdChain.replace(/,/g, ''));
    const sellOrderId = Number(sellOrderIdChain.replace(/,/g, ''));
    const units = Number(unitsChain.replace(/,/g, ''));
    const projectId = Number(projectIdChain.replace(/,/g, ''));
    const feesPaid = Number(feesPaidChain.replace(/,/g, ''));
    const groupId = Number(groupIdChain.replace(/,/g, ''));

    console.log(orderId, sellOrderId, units, pricePerUnit, seller, buyer);
    const convertedPricePerunit = parseFloat(
      (pricePerUnit as string).replace(/,/g, '').slice(0, -18)
    );

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
                  decrement: units,
                },
                totalValue: {
                  decrement: (convertedPricePerunit as number) * units,
                },
                sellorders: {
                  update: {
                    where: {
                      orderId: sellOrderId,
                    },
                    data: {
                      // isSold: sellOrder?.unitsRemain == units ? true : false,
                      unitsRemain: {
                        decrement: units,
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
              projectId: projectId,
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
              credits: units,
              creditPrice: convertedPricePerunit as number,
              from: seller as string,
              to: buyer as string,
              fee: feesPaid,
              createdAt: createdAt.toISOString(),
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
                  increment: units,
                },
                totalValue: {
                  increment: (convertedPricePerunit as number) * units,
                },
                creditPrice: convertedPricePerunit as number,
                quantity: {
                  increment: units,
                },
                creditsOwnedPerGroup: {
                  upsert: {
                    where: {
                      addressGroupId: `${buyer}_${groupId}_${projectId}`,
                    },
                    update: {
                      creditsOwned: {
                        increment: units,
                      },
                    },
                    create: {
                      groupId: groupId,
                      addressGroupId: `${buyer}_${groupId}`,
                      creditsOwned: units,
                    },
                  },
                },
                buyOrders: {
                  create: {
                    creditsOwned: units,
                    retiredCredits: 0,
                    creditPrice: convertedPricePerunit as number,
                    orderId: orderId,
                    groupId: groupId,
                    createdAt: createdAt.toISOString(),
                  },
                },
              },
              create: {
                projectId: projectId,
                creditsOwned: units,
                retiredCredits: 0,
                totalValue: (convertedPricePerunit as number) * units,
                addressProjectId: `${buyer}_${projectId}`,
                creditPrice: convertedPricePerunit as number,
                quantity: units,
                creditsOwnedPerGroup: {
                  create: {
                    groupId: groupId,
                    addressGroupId: `${buyer}_${groupId}_${projectId}`,
                    creditsOwned: units,
                  },
                },
                buyOrders: {
                  create: {
                    creditsOwned: units,
                    retiredCredits: 0,
                    creditPrice: convertedPricePerunit as number,
                    orderId: orderId,
                    groupId: groupId,
                    createdAt: createdAt.toISOString(),
                  },
                },
                sellorders: undefined,
              },
            },
          },
          creditTransactions: {
            create: {
              type: CreditTransactionType.PURCHASE,
              projectId: projectId,
              description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut a ullamcorper dignissim euismod amet, ridiculus.',
              credits: units,
              creditPrice: convertedPricePerunit as number,
              from: seller as string,
              to: buyer as string,
              fee: feesPaid,
              createdAt: createdAt.toISOString(),
            },
          },
        },
      }),
    ]);

    // await prisma.buyOrderReserved.deleteMany({
    //   where: {buyorderId: orderId},
    // })
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create buy order): ${e.message}`);
  }
}

export async function createTrade(event: Event, createdAt: Date, blockNumber: number, hash: string) {
  try {
    let dataBlock = event.data.toHuman();
    let [
      orderIdChain,
      sellOrderIdChain,
      unitsChain,
      projectIdChain,
      groupIdChain,
      pricePerUnit,
      feesPaidChain,
      seller,
      buyer,
    ] = dataBlock as string[];
    const orderId = Number(orderIdChain.replace(/,/g, ''));
    const sellOrderId = Number(sellOrderIdChain.replace(/,/g, ''));
    const units = Number(unitsChain.replace(/,/g, ''));
    const projectId = Number(projectIdChain.replace(/,/g, ''));
    const feesPaid = Number(feesPaidChain.replace(/,/g, ''));
    const groupId = Number(groupIdChain.replace(/,/g, ''));

    const creditPrice = (pricePerUnit as string).replace(/,/g, '')

    await prisma.$transaction([
      prisma.trade.create({
        data: {
          hash: hash as string,
          buyOrderId: orderId,
          sellOrderId: sellOrderId,
          blockNumber: blockNumber,
          projectId: projectId,
          creditPrice: creditPrice,
          units: units,
          groupId: groupId,
          createdAt: createdAt.toISOString()
        },
      }),
    ]);
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create trade): ${e.message}`);
  }
}