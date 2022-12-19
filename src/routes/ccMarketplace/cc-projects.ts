import { Project } from '../../types/prismaTypes';
import { prisma } from '../../services/prisma';
import { addProjectPrices, createProjectFilter } from '../../utils/filters';
import express, { Request, Response } from 'express';
import { authenticatedAddress } from '../../services/authentification';
import { authMiddle } from '../authentification/auth-middleware';
const router = express.Router();

router.get('/project', async (req: Request, res: Response) => {
  const limit = 10;
  const { filters, sortFilter, cursor, cursorObj } = createProjectFilter(req);
  console.log(filters);

  const [projects, resultCount] = await prisma.$transaction([
    prisma.project.findMany({
      where: filters,
      take: limit,
      cursor: cursorObj,
      skip: cursor === '' ? 0 : 1,
      include: {
        sdgDetails: true,
        batchGroups: true,
      },
      orderBy: [sortFilter],
    }),
    prisma.project.count({
      where: filters,
    }),
  ]);

  const projectsWithMinMaxCreditPrices: Project = addProjectPrices(projects);
  console.log(projectsWithMinMaxCreditPrices);

  return res.json({
    projects: projectsWithMinMaxCreditPrices,
    nextId: projects.length === limit ? projects[limit - 1].id : undefined,
    count: resultCount,
  });
});

router.get('/project/:projectId', async (req: Request, res: Response) => {
  const projectId = Number(req.params.projectId);
  console.log('projectId', req.params.projectId);
  console.log('projectId', projectId);
  if (isNaN(projectId)) return res.status(400).end();

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });
  if (!project) return res.status(400).end();

  res.status(200).json(project);
});

router.post('/project/:projectId/edit', async (req: Request, res: Response) => {
  const address = await authenticatedAddress(req);
  const projectId = Number(req.query.projectId);
  if (isNaN(projectId)) return res.status(400).end();

  const isOwner = await prisma.project.count({
    where: {
      id: projectId,
      originator: address,
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
    },
  });

  return res.status(200).json(true);
});

router.get(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    const address = req.session?.address;
    console.log('address', address);
    console.log('projectId', projectId);
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
  }
);

router.post(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
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
  }
);

router.delete(
  '/project/:projectId/star',
  authMiddle,
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    const address = req.session?.address;
    console.log('address', address);
    console.log('projectId', projectId);
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
  }
);

export default router;
