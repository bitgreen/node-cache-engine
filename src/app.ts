// Bitgreen API Server

/* import packages */
import express, { Express, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import carbonCredit from './routes/carbon-credit'; //./routes/carbon-credit.js
import transaction from './routes/transaction';
import profile from './routes/ccMarketplace/profile/profile';
import ccProjects from './routes/ccMarketplace/cc-projects';
import cart from './routes/ccMarketplace/profile/cart';
import investments from './routes/ccMarketplace/dex/investments';
import sellOrder from './routes/ccMarketplace/dex/sell-order';
import kyc from './routes/ccMarketplace/kyc/kyc-approval';
import ipfs from './routes/ccMarketplace/ipfs';
import authentification from './routes/authentification/authentification'; //./routes/authentification/authentification.js

/* config */
dotenv.config();
const port = process.env.API_PORT || 3000;

// array of all allowed origins
// TODO: Add list of origins
const allowed_origins = ['*'];
const cors_options: CorsOptions = {
  origin: allowed_origins,
};

// main function
const mainLoop = async () => {
  /* setup app */
  const app: Express = express();

  // Raise file size limit to 20mb so that we can upload large files through /ipfs.
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(express.json());
  app.use(cookieParser());

  app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
  app.get('/', function (req: Request, res: Response) {
    res.send('Hello from Bitgreen!');
  });

  app.use('', carbonCredit);
  app.use('', transaction);
  app.use('', ccProjects);
  app.use('', ipfs);
  app.use('', profile);
  app.use('', authentification);
  app.use('', cart);
  app.use('', investments);
  app.use('', sellOrder);
  app.use('', kyc);
  // app.use("", require("./routes/test-routes"));

  /* serve api */
  const server = app.listen(port, function () {
    console.log(`API server is listening at: http://localhost:${port}.`);
  });
};

// run main function
mainLoop().catch(console.error);

// write a fetch command in javascript
