import { prisma } from '../../../services/prisma';
import express, { Request, Response } from 'express';
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '../../../services/authentification';

const router = express.Router();

router.get('/carts', authMiddle, async (req: Request, res: Response) => {
  console.log('Cards');
  const profil = await prisma.profil.findUnique({
    where: {
      address: req.session?.address,
    },
    include: {
      cartItems: true,
    },
  });
  // profil?.cartItems.forEach((item) => {
  //   item.projectPrices.sort(function(a:any, b:any){return a-b})
  // })
  return res.status(200).json(profil?.cartItems);
});

router.get('/full-carts', authMiddle, async (req: Request, res: Response) => {
  const profil = await prisma.profil.findUnique({
    where: {
      address: req.session?.address,
    },
    include: {
      cartItems: { include: { batchEntities: true } },
    },
  });
  const projectIds = profil?.cartItems.map((item) => item.projectId);
  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
    },
    include: {
      registryDetails: true,
      batchGroups: true,
    },
  });
  const cartProjects = profil?.cartItems.map((item) => {
    const pro = projects.find((el) => el.id === item.projectId);
    return { ...item, project: pro };
  });
  return res.status(200).json(cartProjects);
});

router.post('/cart', authMiddle, async (req: Request, res: Response) => {
  const {
    projectId,
    projectName,
    projectImageUrl,
    projectPrices,
    batchEntities,
  } = req.body;
  console.log(projectId, projectName);
  const profil = await prisma.profil.findUnique({
    where: {
      address: req.session?.address,
    },
    include: {
      cartItems: true,
    },
  });

  let cartitems = [];
  console.log(profil);
  if (!profil)
    return res.status(200).json({ success: false, isProfile: false });

  if (profil?.cartItems) {
    console.log(
      'Exist',
      profil.cartItems.some((el) => el.projectId === projectId)
    );
    if (profil.cartItems.some((el) => el.projectId === projectId))
      return res.status(200).json({ isExist: true });
  }
  cartitems.push({
    projectName: projectName,
    projectId: projectId,
    projectImageUrl: projectImageUrl,
    projectPrices: projectPrices,
    batchEntities: {
      create: batchEntities,
    },
  });
  console.log(cartitems);
  await prisma.profil.update({
    where: { address: req.session?.address },
    data: {
      cartItems: {
        create: cartitems,
      },
    },
  });
  return res.status(200).json({ success: true });
});

router.patch('/full-cart', authMiddle, async (req: Request, res: Response) => {
  console.log("patch cart",req.body)
  const {cartId, batchEntitiyId, quantity} = req.body;
  console.log(cartId, batchEntitiyId, quantity)
  if (isNaN(Number(cartId)) || isNaN(Number(batchEntitiyId)) || isNaN(Number(quantity))) return res.status(400).json(undefined)
  await prisma.profil.update({
    where: { address: req.session?.address },
    data: {
      cartItems:{
        update: {
          where:{id: cartId as number},
          data:{
            batchEntities:{
              update: {
                where:{id: batchEntitiyId as number},
                data:{quantity: quantity as number}
              }
            }
          }
        }
      }
    }
  })
  return res.status(200).json({success: true,quantity:quantity});

})

router.delete('/full-cart', authMiddle, async (req: Request, res: Response) => {
  const { cartId, batchEntitiyId, deleteAll } = req.query;
  const id = Number(cartId);
  const beId = Number(batchEntitiyId);
  const dAll = deleteAll === 'true' ? true : false;
  console.log('deleteAll', dAll, deleteAll);
  if (isNaN(id) || isNaN(beId)) return res.status(200).json({ success: false });
  console.log('id', id);
  console.log('beId', beId);
  const updateParams = dAll
    ? {
        delete: {
          id: id,
        },
      }
    : {
      update: {
        where: {
          id: id,
        },
        data: {
          batchEntities: {
            delete: { id: beId },
          },
        },
      }}

  await prisma.profil.update({
    where: {
      address: req.session?.address, //"5CJpxdAFyLd1YhGBmC7FToe2SWrtR6UvGZcqpjKbxYUhRjWx"
    },
    data: {
      cartItems: updateParams,
    },
  });
  return res.status(200).json({ success: true });
});


export default router;
