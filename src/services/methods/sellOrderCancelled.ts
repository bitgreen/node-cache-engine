import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function sellOrderCancelled(event: Event, cancelledAt: Date) {
  try {
    let data = event.data.toJSON();
    let [orderId] = data as (number)[];

    const profile = await prisma.profil.findFirst({
      where:{
        investments: {
          some: {
            sellorders: {
              some: {orderId: orderId}
            }
          }
        }
      },
      include: {
        investments: {include: {sellorders:true}}
      }
    })
    const account = profile?.address;
    const inv= profile?.investments.find((i) => i.sellorders.findIndex((s) => s.orderId === orderId) !==-1)  
    const sellOrder = inv?.sellorders.find((s) => s.orderId === orderId);
  
    await prisma.profil.update({
      where:{ address: account},
      data:{
        investments: {
          update: {
            where: {id: inv?.id},
            data: {
              creditsOwned: {
                increment: sellOrder?.unitsRemain as number,
              },
              creditsOwnedPerGroup: {
                update: {
                  where: {
                    addressGroupId: `${account}_${sellOrder?.groupId}_${inv?.projectId}`,
                  },
                  data: {
                    creditsOwned: {
                      increment: sellOrder?.unitsRemain as number,
                    },
                  },
                },
              },
              sellorders:{
                update: {
                  where: {orderId:orderId},
                  data: {
                    isCancel: true,
                    cancelledAt: cancelledAt.toISOString()
                  }
                }
              }
            }
          }
        }
      }
    })


  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create sell order): ${e.message}`);
  }
}
