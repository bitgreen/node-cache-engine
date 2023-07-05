import { Investment, Project } from '@/types/prismaTypes';
import { BatchGroups, SellOrder } from '@prisma/client';

export function addProjectTokens(projects: any) {
  return projects.map((project: any) => {
    const [min, max] = calculateMinMaxProjectTokens(project);
    return {
      ...project,
      minToken: min,
      maxToken: max,
    };
  });
}

function calculateMinMaxProjectTokens(project: Project): [number, number] {
  const sortedBatchGroups = project.batchGroups.sort(function (
    a: BatchGroups,
    b: BatchGroups
  ) {
    return (a.totalSupply as number) - (b.totalSupply as number);
  });
  if (!sortedBatchGroups) return [0, 0];
  return [
    sortedBatchGroups[0]?.totalSupply ?? 0,
    sortedBatchGroups[sortedBatchGroups.length - 1]?.totalSupply ?? 0,
  ];
}

export function filterAndAddProjectPrice(
  projects: any[],
  invs: Investment[],
  minCreditQuantity: number,
  inputMin: number,
  isChecked: boolean,
) {
 
  const newProjects: Project[]= [];
  for (const project of projects) {
    const investment = invs.filter((i) => i.projectId === project.id);
    console.log("investment",investment)
    const sellOrders: SellOrder[] = []
    investment.forEach((i) => i.sellorders.forEach((s) => sellOrders.push(s)))
    const minQ = sellOrders.reduce((acc, val) => acc+ val.unitsRemain ,0 )
    console.log("isChecked", isChecked)
    if (inputMin == 0 && !isChecked && sellOrders.length === 0) {
      newProjects.push({ ...project, minPrice: 0, maxPrice: 0 });
      continue
    }
    if (!sellOrders || sellOrders.length === 0) continue;
    if (minQ < minCreditQuantity) continue;
    const [min, max] = investment ? calculateMinMaxProjectPrice(sellOrders) : [0,0]

    newProjects.push({ ...project, minPrice: min, maxPrice: max });
  }
  return newProjects;
//   projects = projects.filter((project) =>
//     invs.some((i) => i.projectId === project.id)
//   );
}

function calculateMinMaxProjectPrice(
  sellOrders: SellOrder[]
): [number, number] {
  const sortedSellOrders = sellOrders.sort(function (
    a: SellOrder,
    b: SellOrder
  ) {
    return (a.pricePerUnit as number) - (b.pricePerUnit as number);
  });
  if (!sortedSellOrders) return [0, 0];
  return [
    sortedSellOrders[0]?.pricePerUnit ?? 0,
    sortedSellOrders[sortedSellOrders.length - 1]?.pricePerUnit ?? 0,
  ];
}
