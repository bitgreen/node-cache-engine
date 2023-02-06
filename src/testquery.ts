
import 'dotenv/config';
import { processBlock } from './services/blockchain-event';
import { Header } from '@polkadot/types/interfaces';
import { initApi } from './services/polkadot-api';
import { prisma } from './services/prisma';

// main function (must be async)
async function main() {

  console.log("test")
  // const id = 8;
  // const api = await initApi();

  // let data  = await api.query["carbonCredits"]["projects"](id)
  // console.log(data.toJSON())
  // console.log(data.toHuman())
  let [
    orderId,
    units,
    projectId,
    groupId,
    pricePerUnit,
    feesPaid,
    seller,
    buyer,
  ] = [0,123,24,0,1,1,"5CJpxdAFyLd1YhGBmC7FToe2SWrtR6UvGZcqpjKbxYUhRjWx","5DjjUGJKbbKTx1mFsRNZj4wa9BiabU6T7k6ndxmfcFkMZGX7"];
  console.log(orderId, units, pricePerUnit, seller, buyer);
  const profil = await prisma.profil.findMany({
    where: {
      OR: [{ address: seller as string }, { address: buyer as string }],
    },
    include: {
      investments: { include: { sellorders: true } },
    },
  });
  console.log(profil);

    // BUYER
    const investmentBuyer = profil
      ?.find((p) => p.address === buyer)
      ?.investments.find((i) => i.projectId === projectId);
    console.log('investmentBuyer', investmentBuyer);
    console.log('id',  investmentBuyer?.id);
    const idd = investmentBuyer?.id ? investmentBuyer?.id : "uzhgg"
    console.log('idd',  idd);
    
    const unitSum = (units as number) +  (investmentBuyer?.creditsOwned ? investmentBuyer?.creditsOwned as unknown as number :0);
    console.log('unitSum',  unitSum);

    await prisma.profil.update({
      where: {
        address: buyer as string,
      },
      data: {
        investments: {
          upsert: {
            where: { id: idd }, 
            update: {
              creditsOwned: unitSum,//units as number + (investmentBuyer?.creditsOwned as unknown as number),
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
      },
    });


}

main().catch(console.error);