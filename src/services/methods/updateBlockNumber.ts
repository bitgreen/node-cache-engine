import { prisma } from './../prisma';


export async function updateBlockNumber(blockNumber:number, blockHash:string) {
    try {
        await prisma.block.upsert({
            where: {id: 1},
            update: {
                blockNumber: blockNumber,
                hash: blockHash,
                count: {increment: 1}
            },
            create:{
                blockNumber: blockNumber,
                hash: blockHash,
                count: 0
            }
        })
    }catch(e){
        console.log(e);
    }
}