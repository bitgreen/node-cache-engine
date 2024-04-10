// Bitgreen API Server

/* import packages */
import cron from 'node-cron';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import * as dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import authentification from './routes/authentification/authentification'; //./routes/authentification/authentification.js
import carbonCredit from './routes/carbon-credit'; //./routes/carbon-credit.js
import ccProjects from './routes/ccMarketplace/cc-projects';
import assetPrices from './routes/ccMarketplace/dex/asset-prices';
import investments from './routes/ccMarketplace/dex/investments';
import sellOrder from './routes/ccMarketplace/dex/sell-order';
import ipfs from './routes/ccMarketplace/ipfs';
import kyc from './routes/ccMarketplace/kyc/kyc-approval';
import cart from './routes/ccMarketplace/profile/cart';
import profile from './routes/ccMarketplace/profile/profile';
import transaction from './routes/transaction';
import {updateBatchGroupsCron, updateProjectsCron} from "./services/update-projects";

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

  app.use(cors({ credentials: true, origin: '*' }));

  /* 
  if you want to disable cors issues on localhost, use this:
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  ); */

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
  app.use('', assetPrices);
  app.use('', investments);
  app.use('', sellOrder);
  app.use('', kyc);
  // app.use("", require("./routes/test-routes"));

  /* serve api */
  const server = app.listen(port, function () {
    console.log(`API server is listening at: http://localhost:${port}.`);
  });

  await updateProjectsCron()
  await updateBatchGroupsCron()
};

// run main function
mainLoop().catch(console.error);