import { prisma } from '../prisma';
import { Event } from '@polkadot/types/interfaces';

export async function sellOrderCancelled(event: Event) {
  try {
    let data = event.data.toJSON();
    let [orderId] = data as (number)[];
    await prisma.sellOrder.update({
        where: {orderId: orderId}, 
        data:{
            isCancel:true
        }
    })
  } catch (e) {
    // @ts-ignore
    console.log(`Error occurred (create sell order): ${e.message}`);
  }
}
