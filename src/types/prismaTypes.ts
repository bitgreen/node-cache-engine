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
  minToken?: string;
} & { maxToken?: string } & { minPrice?: number } & { maxPrice?: number } ;

const BatchGroupsArg = Prisma.validator<Prisma.BatchGroupsArgs>()({
  include: { batches: true },
});
export type BatchGroups = Prisma.BatchGroupsGetPayload<typeof BatchGroupsArg>;

const CartItemArgs = Prisma.validator<Prisma.CartItemArgs>()({include: {batchEntities:true}})
type CartItem1 = Prisma.CartItemGetPayload<typeof CartItemArgs>
export type CartItem = Omit<CartItem1, "profileId" | "id">;

const InvestmentArg = Prisma.validator<Prisma.InvestmentArgs>()({
  include: { sellorders: true },
});
export type Investment = Prisma.InvestmentGetPayload<typeof InvestmentArg>;
