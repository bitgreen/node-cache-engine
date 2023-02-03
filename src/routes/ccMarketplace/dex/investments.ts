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
      batchGroups: {include:{batches:true}},
    },
  });
  const investmentProjects = profil?.investments.map((item) => {
    const pro = projects.find((el) => el.id === item.projectId);
    return { ...item, project: pro };
  });
  console.log("investmentProjects",investmentProjects)
  return res.status(200).json(investmentProjects);
});

router.get('/project-originator', async (req: Request, res: Response) => {
  const originator = (req.query.originator as string) || '';
  console.log("originator",originator);

  const projects = await prisma.project.findMany({
    where: {
      AND: [
       {
        originator: originator,
       }, 
      //  {
      //   batchGroups: {
      //     some: {
      //       isMinted:true,
      //     }
      //   }
      //  }
      ]
    },
    include: {
      sdgDetails: true,
      registryDetails: true,
      batchGroups: {include:{batches:true}},
    },
  });
  console.log(projects);
  
  const investestments = await prisma.investment.findMany({
    where:{projectId:{in: projects?.map((el) => el.id)}},
  })
  const investmentsProjects = projects?.map((item) => {
    const inv = investestments.find((el) => el.projectId === item.id);
    return { ...inv, project: item };
  });

  return res.json(investmentsProjects);
});

export default router;