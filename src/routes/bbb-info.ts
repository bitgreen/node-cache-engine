import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/bbb-info', async (req: Request, res: Response) => {
  return res.status(200).json({
    price: 0.46
  });
})

export default router;