import { Prisma, RegistryDetails } from '@prisma/client';

const ProjectArg = Prisma.validator<Prisma.ProjectArgs>()({
  include: {
    sdgDetails: true,
    registryDetails: true,
    royalties: true,
    batchGroups: { include: { batches: true } },
  },
});
export type Project = Prisma.ProjectGetPayload<typeof ProjectArg> & {
  minCreditPrice?: string;
} & { maxCreditPrice?: string } & { location: number[][] };

const BatchGroupsArg = Prisma.validator<Prisma.BatchGroupsArgs>()({
  include: { batches: true },
});
export type BatchGroups = Prisma.BatchGroupsGetPayload<typeof BatchGroupsArg>;

const CartItemArgs = Prisma.validator<Prisma.CartItemArgs>()({include: {batchEntities:true}})
type CartItem1 = Prisma.CartItemGetPayload<typeof CartItemArgs>
export type CartItem = Omit<CartItem1, "profilId" | "id">; 
