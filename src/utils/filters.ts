import {AssetTransactionType, SdgType, SellOrder} from '@prisma/client';
import { BatchGroups, Project } from './../types/prismaTypes';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../services/prisma';


export function createProjectFilter(req: Request) {
  const cursor = req.query.cursor ?? '';
  const cursorObj =
    cursor === '' ? undefined : { id: parseInt(cursor as string) };
  const search = (req.query.search as string) ?? '';
  const projectTypes = (req.query.projectType as string) ?? undefined;
  const projectTypesFilter = createFilter(projectTypes, 'type');
  const projectStates = (req.query.projectState as string) ?? undefined;
  const projectStatesFilter = createFilter(projectStates, 'state');
  const projectSdgs = (req.query.sdgs as string) ?? undefined;
  const projectSdgsFilter = projectSdgs
    ? projectSdgs.split(',').map((str) => str as SdgType)
    : undefined;
  // const minCreditPrice = (req.query.minCreditPrice as string) ?? undefined;
  // const maxCreditPrice = (req.query.maxCreditPrice as string) ?? undefined;
  // const minCreditPriceFilter = createCreditPriceFilter(
  //   Number(minCreditPrice),
  //   Number(maxCreditPrice)
  // );
  const ids = (req.query.ids as string) ?? undefined;
  const idsFilter = ids
    ? ids.split(',').map((str) => parseInt(str))
    : undefined;
  const startYear = (req.query.startYear as string) ?? undefined;
  const endYear = (req.query.endYear as string) ?? undefined;
  const creationYearFilter =
    startYear || endYear
      ? createCreationYearFilter(Number(startYear), Number(endYear))
      : undefined;

  const sort = (req.query.sort as ProjectSortOptions) ?? undefined;
  const sortFilter = createSorting(sort);
  const filters = {
    AND: [
      { ...projectTypesFilter },
      { ...projectStatesFilter },
      // { ...minCreditPriceFilter },
      { ...creationYearFilter },
      {
        OR: [
          {
            sdgDetails: {
              some: {
                sdgType: { in: projectSdgsFilter },
              },
            },
          },
        ],
      },
      {
        OR: [
          {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            registryDetails: {
              some: {
                summary: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ],
      },
      {
        id: { in: idsFilter },
      },
    ],
  };

  return {
    filters: filters,
    sortFilter: sortFilter,
    cursor: cursor,
    cursorObj: cursorObj,
  };
}

export async function createAssetTransactionFilter(req: Request, res: Response) {
  const projectId = (req.query.projectId as string) ?? undefined;
  const assetId = (req.query.assetId as string) ?? undefined;
  const type: AssetTransactionType = (req.query.transactionType as AssetTransactionType) ?? undefined;

  let assetIds: (number | string)[] = []
  if(projectId) {
    const assetIdsRes = await prisma.batchGroups.findMany({
      where: {
        project: {
          id: {
            in: projectId.split(',').map((pId) => Number(pId))
          }
        }
      },
      select: {
        assetId: true,
      },
      distinct: 'assetId'
    })

    if(assetIdsRes?.length) {
      assetIds = assetIdsRes.map(item => item.assetId)
    } else {
      throw new Error('Invalid projectId.')
    }
  }

  if(assetId) {
    assetIds.push(assetId)
  }

  const assetIdFilter: any = createFilter(assetIds.join(','), 'assetId', true);

  const validateTypeInput = type?.split(',').every(type => Object.values(AssetTransactionType).includes(type as AssetTransactionType));
  if(type && !validateTypeInput) {
    throw new Error('Invalid type provided.')
  }

  const transactionTypeFilter = createFilter(type, 'type')

  return {
    assetIdFilter,
    transactionTypeFilter
  }
}

function createFilter(filterStr: string, key: string, asId?: boolean) {
  if (!filterStr) return undefined;

  const filters = filterStr.split(',').map((filter) => ({
    [key]: {
      equals: asId ? Number(filter) : filter,
    },
  }));

  return {
    OR: filters,
  };
}

function createCreditPriceFilter(min: number, max: number) {
  if (!min || !max) return undefined;
  return {
    AND: [
      {
        batchGroups: {
          some: {
            totalSupply: {
              gte: min,
            },
          },
        },
      },
      {
        batchGroups: {
          some: {
            totalSupply: {
              lte: max,
            },
          },
        },
      },
    ],
  };
}

function createCreationYearFilter(startYear: number, endYear: number) {
  if (startYear && endYear) {
    return {
      createdAt: {
        gte: new Date(`${startYear}-01-01`),
        lte: new Date(`${endYear}-12-31`),
      },
    };
  }
  if (!startYear && endYear) {
    return {
      createdAt: {
        lte: new Date(`${endYear}-12-31`),
      },
    };
  }
  if (startYear && !endYear) {
    return {
      createdAt: {
        gte: new Date(`${startYear}-01-01`),
      },
    };
  }
}

function createSorting(sortby: ProjectSortOptions) {
  switch (sortby) {
    case ProjectSortOptions.ALPHABETICAL_ASC:
      return {
        name: Prisma.SortOrder.asc,
      };
    case ProjectSortOptions.ALPHABETICAL_DESC:
      return {
        name: Prisma.SortOrder.desc,
      };
    case ProjectSortOptions.DATE_ASC:
      return {
        createdAt: Prisma.SortOrder.asc,
      };
    case ProjectSortOptions.DATE_DESC:
      return {
        createdAt: Prisma.SortOrder.desc,
      };
    case ProjectSortOptions.VALUE_ASC:
      return {
        unitPrice: Prisma.SortOrder.asc,
      };
    case ProjectSortOptions.VALUE_DESC:
      return {
        unitPrice: Prisma.SortOrder.desc,
      };

    default:
      return {
        name: Prisma.SortOrder.asc,
      };
  }
}

//Any type fix


enum ProjectSortOptions {
  DEFAULT = '',
  ALPHABETICAL_ASC = 'alphabetical-asc',
  ALPHABETICAL_DESC = 'alphabetical-desc',
  DATE_ASC = 'date-asc',
  DATE_DESC = 'date-desc',
  VALUE_ASC = 'value-asc',
  VALUE_DESC = 'value-desc',
}
