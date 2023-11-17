import { Project } from '../../types/prismaTypes';
import { prisma } from '../../services/prisma';
import { createProjectFilter } from '../../utils/filters';
import express, { Request, Response } from 'express';
import { authenticatedAddress } from '../../services/authentification';
import { authKYC, authMiddle } from '../authentification/auth-middleware';
import { addProjectTokens, filterAndAddProjectPrice } from '../../utils/projectsCalc';
const router = express.Router();

router.get('/project', async (req: Request, res: Response) => {
  const limit = 10;
  console.log('/project');
  const { filters, sortFilter, cursor, cursorObj } = createProjectFilter(req);
  try {
    let [projects, resultCount] = await prisma.$transaction([
      prisma.project.findMany({
        where: {
          ...filters,
          listedToMarketplace: true
        },
        take: limit,
        cursor: cursorObj,
        skip: cursor === '' ? 0 : 1,
        include: {
          sdgDetails: true,
          registryDetails: true,
          batchGroups: { include: { batches: true } },
        },
        orderBy: [sortFilter],
      }),
      prisma.project.count({
        where: filters,
      }),
    ]);
    let minCreditPrice = (req.query.minCreditPrice as string) ?? undefined;
    const maxCreditPrice = (req.query.maxCreditPrice as string) ?? undefined;
    const minCreditQuantity = (req.query.minCreditQuantity as string) ?? undefined;
    const sellChecked = (req.query.sellChecked as string) ?? "true";

    if (minCreditPrice && maxCreditPrice) {
      // if (sellChecked == "true" && Number(minCreditPrice) == 0)  minCreditPrice = "0.001"
      const invs = await prisma.investment.findMany({
        where: {
          AND: [
            {
              projectId: {
                in: projects.map((p) => p.id),
              },
            },
            {
              sellorders: {
                some: {
                  AND: [
                    {
                      isCancel: false,
                    },
                    {
                      isSold: false,
                    },
                    {
                      pricePerUnit: {
                        gte: Number(minCreditPrice),
                        lte: Number(maxCreditPrice),
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
        include: { sellorders: true },
      });
      const minCreditQuantityLimit = Number(minCreditQuantity) ? Number(minCreditQuantity) : 0;
      projects = filterAndAddProjectPrice(projects,invs,minCreditQuantityLimit,Number(minCreditPrice), sellChecked == "true" ? true : false)
    }
    const projectsWithMinMaxCreditPrices: Project = addProjectTokens(projects);
    // console.log("projectsWithMinMaxCreditPrices",projectsWithMinMaxCreditPrices)
    return res.json({
      projects: projectsWithMinMaxCreditPrices,
      nextId: projects.length === limit ? projects[limit - 1].id : undefined,
      count: resultCount,
    });
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get('/project/:projectId', async (req: Request, res: Response) => {
  console.log('/project/:projectId');

  try {
    const projectId = Number(req.params.projectId);

    if (isNaN(projectId)) return res.status(400).end();

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        sdgDetails: true,
        registryDetails: true,
        batchGroups: { include: { batches: true } },
      },
    });
    if (!project) return res.status(400).end();

    res.status(200).json(project);
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.post(
  '/project/:projectId/edit',
  authMiddle,
  async (req: Request, res: Response) => {
    console.log('post /project/:projectId/edit');

    try {
      const projectId = Number(req.params.projectId);
      if (isNaN(projectId)) return res.status(400).end();

      const isOwner = await prisma.project.count({
        where: {
          id: projectId,
          originator: req.session?.address,
        },
      });

      if (isOwner !== 1) return res.status(403).end();

      await prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          name: req.body.title,
          description: req.body.description,
          images: req.body.featuredImageUrls,
        },
      });

      return res.status(200).json(true);
    } catch (e) {
      return res.status(500).json(e);
    }
  }
);

router.get(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
    console.log('post /project/:projectId/star');
    try {
      const projectId = Number(req.params.projectId);
      const address = req.session?.address;
      if (isNaN(projectId)) {
        res.status(400).end();
        return;
      }

      const starred = await prisma.star.findUnique({
        where: {
          profilAddress_projectId: {
            profilAddress: address as string,
            projectId: projectId,
          },
        },
      });
      res.status(200).json(starred !== null);
    } catch (e) {
      return res.status(500).json(e);
    }
  }
);

router.get(
  '/starred-project',
  authMiddle,
  async (req: Request, res: Response) => {
    console.log('/starred-project');
    try {
      const address = req.session?.address || '';

      const profile = await prisma.profile.findUnique({
        where: { address: address },
        include: { stars: true },
      });
      const sIds = profile?.stars.map((s) => s.projectId);
      const projects = await prisma.project.findMany({
        where: { id: { in: sIds } },
        include: {
          sdgDetails: true,
          registryDetails: true,
          batchGroups: { include: { batches: true } },
        },
      });
      return res.json(projects);
    } catch (e) {
      return res.status(500).json(e);
    }
  }
);

router.post(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
    console.log('post /project/:projectId/star');
    try {
      const projectId = Number(req.params.projectId);
      const address = req.session?.address;
      console.log('address', address);
      console.log('projectId', projectId);
      if (isNaN(projectId)) {
        res.status(400).end();
        return;
      }

      await prisma.star.create({
        data: {
          profilAddress: address as string,
          projectId: projectId,
        },
      });
      res.status(200).json(true);
    } catch (e) {
      return res.status(500).json(e);
    }
  }
);

router.delete(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
    console.log('delete /project/:projectId/star');
    try {
      const projectId = Number(req.params.projectId);
      const address = req.session?.address;
      if (isNaN(projectId)) {
        res.status(400).end();
        return;
      }

      await prisma.star.delete({
        where: {
          profilAddress_projectId: {
            projectId: projectId,
            profilAddress: address as string,
          },
        },
      });

      res.status(200).json(true);
    } catch (e) {
      return res.status(500).json(e);
    }
  }
);

router.delete('/project/delete',authKYC, async (req: Request, res: Response) => {
  console.log('delete /project/delete');

  try {
    const projectId = Number(req.query.projectId);

    if (isNaN(projectId)) {
      res.status(400).end();
      return;
    }

    const deleteProject = prisma.project.delete({
      where: {
        id: projectId,
      },
    });
    const deleteInvestments = prisma.investment.deleteMany({
      where: {projectId: projectId},
    })
    await prisma.$transaction([deleteProject, deleteInvestments])
    

    res.status(200).json(true);
  } catch (e) {
    return res.status(500).json(e);
  }
});
router.get('/project-originator/:address', async (req: Request, res: Response) => {
  console.log('get /project-originator/:address');

  try {
    const address = req.params.address

    const projects = await prisma.project.findMany({
      where: {
        originator: address,
      },
      include: {
        sdgDetails: true,
        batchGroups: {include: {batches: true}}
      }
    });
    const invs = await prisma.investment.findMany({
      where: {
        AND: [
          {
            projectId: {
              in: projects.map((p) => p.id),
            },
          },
          {
            sellorders: {
              some: {
                AND: [
                  {
                    isCancel: false,
                  },
                  {
                    isSold: false,
                  }
                ],
              },
            },
          },
        ],
      },
      include: { sellorders: true },
    });
    const projectsFiltered = filterAndAddProjectPrice(projects,invs,0,0,false)

    res.status(200).json(projectsFiltered);
  } catch (e) {
    return res.status(500).json(e);
  }
});

export default router;
