
import axios from 'axios';
import { prisma } from './prisma';
import logger from "@/utils/logger";
import {AssetTransactionType} from "@prisma/client";
import BigNumber from "bignumber.js";

interface GeckoResponse {
    polkadot: {
        usd: number
    },
    tether: {
        usd: number
    }
}

export async function fetchExchangeRate() {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=polkadot%2Ctether&vs_currencies=usd"
    try {
        const response = await axios.get<GeckoResponse>(url);
        await prisma.exchangeRate.upsert({
            where: {id: 1}, 
            update: {
                exchangeRateDOT: response.data.polkadot.usd,
                exchangeRateUSDT: response.data.tether.usd
            },
            create: {
                exchangeRateDOT: response.data.polkadot.usd,
                exchangeRateUSDT: response.data.tether.usd
            }
        })
    } catch (e: any) {
        logger.error(`fetchExchangeRate: ${e.message}`)
    }
}

export async function getAssetPrice(assetId: number) {
    const trades = await prisma.assetTransaction.findMany({
        where: {
            assetId: assetId,
            type: AssetTransactionType.PURCHASED
        },
        orderBy: {
            blockNumber: 'desc',
        },
        select: {
            amount: true,
            pricePerUnit: true
        },
        take: 10, // Take the last 10 trades
    });
    if (!trades.length) {
        return {assetId, averagePrice: '0', totalVolume: '0'}; // Return '0' if there are no trades
    }
    let totalVolume = new BigNumber(0);
    let totalPriceVolume = new BigNumber(0);
    trades.forEach((trade) => {
        const tradePrice = new BigNumber(trade.pricePerUnit || 0);
        const tradeVolume = trade.amount;

        // Calculate total volume and total price volume
        totalVolume = totalVolume.plus(tradeVolume);
        totalPriceVolume = totalPriceVolume.plus(tradePrice.multipliedBy(tradeVolume));
    });
    // Calculate volume-weighted average price
    const averagePrice = totalPriceVolume.dividedBy(totalVolume).dividedBy(new BigNumber(10).pow(18));
    return {
        assetId,
        price: averagePrice.toFixed(2)
    };
}