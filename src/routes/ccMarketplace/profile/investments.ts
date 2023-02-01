import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';

const router = express.Router();

router.get('/investments',authMiddle, async (req: Request, res: Response) => {
  console.log('Cards');
  const profil = await prisma.profil.findUnique({
    where: {
      address: req.session?.address,//req.session?.address,
    },
    include: {
      investments: true,
    },
  });
  const projectIds = profil?.investments.map((item) => item.projectId);
  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
    },
    include: {
      registryDetails: true,
      batchGroups: true,
    },
  });
  const investmentProjects = profil?.investments.map((item) => {
    const pro = projects.find((el) => el.id === item.projectId);
    return { ...item, project: pro };
  });
  console.log("investmentProjects",investmentProjects)
  return res.status(200).json(investmentProjects);
});

export default router;