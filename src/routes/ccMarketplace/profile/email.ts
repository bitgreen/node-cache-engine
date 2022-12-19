import { prisma } from "../../../services/prisma";
import express, {  Request, Response } from "express";
import { authMiddle } from '../../authentification/auth-middleware';
import validator from 'validator';
import { authenticatedAddress } from '@/services/authentification';

const router = express.Router();


// router.post("/save-email", authMiddle, async (req:Request, res:Response) => {


// }