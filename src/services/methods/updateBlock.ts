import { prisma } from './../prisma';


export async function updateBlock(blockNumber:number, blockHash:string, createdAt: Date) {
    try {
        await prisma.block.upsert({
            where: {
                number: blockNumber
            },
            update: {
                hash: blockHash,
                createdAt: createdAt,
                fetchedAt: new Date().toISOString()
            },
            create: {
                number: blockNumber,
                hash: blockHash,
                createdAt: createdAt,
                fetchedAt: new Date().toISOString()
            }
        })
    } catch(e) {
        console.log(e);
    }
}