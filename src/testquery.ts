
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';
import { convertHex } from './utils/converter';
import { Account, BalanceData } from './types/types';

interface RetireData {
  name: string;
  uuid: string;
  issuanceYear: number;
  count: number;
}
// main function (must be async)
async function main() {

  console.log("test")
  // const id = 8;
  // const api = await initApi();
  const orderId = 74
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
  console.log("profile",profile)
  const account = profile?.address;
  const inv= profile?.investments.find((i) => i.sellorders.findIndex((s) => s.orderId === orderId) !==-1)
  console.log("inv",inv)

  const sellOrder = inv?.sellorders.find((s) => s.orderId === orderId);
  console.log("sellOrder",sellOrder)

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
                }
              }
            }
          }
        }
      }
    }
  })
}

main().catch(console.error);