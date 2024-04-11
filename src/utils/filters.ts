import {AssetTransaction, AssetTransactionType, BatchGroupType, SdgType, SellOrder} from '@prisma/client';
import { BatchGroups, Project } from './../types/prismaTypes';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { getName } from 'country-list';


export function createProjectFilter(req: Request) {
  const cursor = req.query.cursor ?? '';
  const cursorObj =
    cursor === '' ? undefined : { id: parseInt(cursor as string) };
  const search = (req.query.search as string) ?? '';
  const projectTypes = (req.query.projectType as string) ?? undefined;
  const projectTypesFilter = createFilter(projectTypes, 'type');

  const marketType = (req.query.marketType as string) ?? undefined;
  let batchType: BatchGroupType | undefined
  if(marketType === 'spot') batchType = 'CREDITS'
  if(marketType === 'forwards') batchType = 'FORWARDS'
  if(marketType === 'shares') batchType = 'SHARES'

  const marketTypeFilter = batchType ? {
    batchGroups: {
      some: {
        type: batchType
      }
    }
  } : undefined;

  const projectStates = (req.query.location as string) ?? undefined;
  const projectStatesFilter = projectStates ? {
    AND: [{
      location: {
        contains: getName(projectStates)
      }
    }]
  } : undefined;

  const projectSdgs = (req.query.sdgs as string) ?? undefined;
  const projectSdgsFilter = projectSdgs
    ? projectSdgs.split(',').map((str) => str as SdgType)
    : undefined;
  const ids = (req.query.ids as string) ?? undefined;
  const idsFilter = ids
    ? ids.split(',').map((str) => parseInt(str))
    : undefined;
  const startYear = Number(req.query.startYear as string) ?? undefined;
  const endYear = Number(req.query.endYear as string) ?? undefined;

  const vintageYearFilter = (startYear || endYear) ? {
    AND: [{
      batchGroups: {
        some: {
          batches: {
            some: {
              startDate: {
                gte: startYear
              },
              endDate: {
                lte: endYear
              }
            }
          }
        }
      }
    }]
  } : undefined

  const sort = (req.query.sort as ProjectSortOptions) ?? undefined;
  const sortFilter = createSorting(sort);
  const filters = {
    AND: [
      { ...projectTypesFilter },
      { ...marketTypeFilter },
      { ...projectStatesFilter },
      { ...vintageYearFilter },
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

export async function createTransactionFilter(req: Request) {
  const startDate = (req.query.startDate as string) ?? undefined;
  const endDate = (req.query.endDate as string) ?? undefined;
  const sortBy = (req.query.sortBy as string) ?? 'desc';

  const dateFilter = (startDate || endDate) ? {
    AND: {
      createdAt: {
        gte: startDate ? new Date(startDate).toISOString() : new Date(0),
        lte: endDate ? new Date(endDate).toISOString() : new Date()
      },
    }
  } : {};

  const sortFilter = [
    {
      blockNumber: sortBy === 'asc' ? Prisma.SortOrder.asc : Prisma.SortOrder.desc,
    }
  ]

  const paginationFilter = (totalRecords: number, pageSize: number, page: number) => {
    const skip = (page - 1) * pageSize;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      skip: skip,
      take: pageSize
    }
  }

  return {
    dateFilter,
    sortFilter,
    paginationFilter
  }
}

export async function createAssetTransactionFilter(req: Request) {
  const projectId = (req.query.projectId as string) ?? undefined;
  const assetId = (req.query.assetId as string) ?? undefined;
  const sortBy = (req.query.sortBy as string) ?? 'desc';

  const type: AssetTransactionType = (req.query.transactionType as AssetTransactionType) ?? undefined;

  if(projectId && assetId) throw new Error('Either use projectId or assetId.')

  const projectIdFilter = projectId ? {
    batchGroup: {
      project: {
        id: Number(projectId)
      }
    }
  } : undefined

  const assetIdFilter: any = createFilter(assetId, 'assetId', true);

  const validateTypeInput = type?.split(',').every(type => Object.values(AssetTransactionType).includes(type as AssetTransactionType));
  if(type && !validateTypeInput) {
    throw new Error('Invalid type provided.')
  }

  const transactionTypeFilter = createFilter(type, 'type', false, true)

  const sortFilter = [
    {
      blockNumber: sortBy === 'asc' ? Prisma.SortOrder.asc : Prisma.SortOrder.desc,
    },
    {
      index: sortBy === 'asc' ? Prisma.SortOrder.asc : Prisma.SortOrder.desc,
    }
  ]

  return {
    projectIdFilter,
    assetIdFilter,
    transactionTypeFilter,
    sortFilter
  }
}

function createFilter(filterStr: string, key: string, asId?: boolean, isOr?: boolean) {
  if (!filterStr) return undefined;

  const filters = filterStr.split(',').map((filter) => ({
    [key]: {
      equals: asId ? Number(filter) : filter,
    },
  }));

  return {
    [isOr ? 'OR' : 'AND']: filters,
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
