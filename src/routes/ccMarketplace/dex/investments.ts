import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';

const router = express.Router();

router.get('/investments', authMiddle, async (req: Request, res: Response) => {
  try {
    console.log('/investments');
    const whereParam =
      req.query.projectId === 'undefined' || isNaN(Number(req.query.projectId))
        ? {}
        : { projectId: Number(req.query.projectId) };
    const profile = await prisma.profile.findUnique({
      where: {
        address: req.session?.address, //req.session?.address,
      },
      include: {
        investments: {
          where: whereParam,
          include: {
            sellorders: true,
            buyOrders: true,
            creditsOwnedPerGroup: true,
          },
        },
      },
    });
    const projectIds = profile?.investments.map((item) => item.projectId);
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
      },
      include: {
        registryDetails: true,
        sdgDetails:true,
        batchGroups: { include: { batches: true } },
      },
    });
    const investmentProjects = profile?.investments.map((item) => {
      const pro = projects.find((el) => el.id === item.projectId);
      return { ...item, project: pro };
    });
    return res.status(200).json(investmentProjects);
  } catch (e) {
    return res.status(500).json(e);
  }
});

router.get(
  '/investments/:investmentId',
  authMiddle,
  async (req: Request, res: Response) => {
    const id = (req.params.investmentId as string) || '';
    console.log('/investments/:investmentId');
    try {
      const investment = await prisma.investment.findUnique({
        where: { id: id },
        include: { sellorders: true },
      });
      return res.status(200).json(investment);
    } catch {
      return res.status(500).json({});
    }
  }
);

router.get('/project-originator', async (req: Request, res: Response) => {
  const originator = (req.query.originator as string) || '';
  console.log('/project-originator');
  try {
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          {
            originator: originator,
          },
        ],
      },
      include: {
        sdgDetails: true,
        registryDetails: true,
        batchGroups: { include: { batches: true } },
      },
    });

    const investestments = await prisma.investment.findMany({
      where: { projectId: { in: projects?.map((el) => el.id) } },
    });
    const investmentsProjects = projects?.map((item) => {
      const inv = investestments.find((el) => el.projectId === item.id);
      return { ...inv, project: item };
    });

    return res.json(investmentsProjects);
  } catch (e) {
    return res.status(500).json(e);
  }
});

export default router;
