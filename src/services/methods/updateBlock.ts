import { prisma } from './../prisma';


export async function updateBlock(blockNumber:number, blockHash:string, createdAt: Date) {
    try {
        await prisma.block.upsert({
            where: {
                number: blockNumber
            },
            update: {
                hash: blockHash,
                createdAt: createdAt
            },
            create: {
                number: blockNumber,
                hash: blockHash,
                createdAt: createdAt,
            }
        })
    } catch(e) {
        // console.log(e);
    }
}