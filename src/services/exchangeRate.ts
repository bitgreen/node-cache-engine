
import axios from 'axios';
import { prisma } from './prisma';
import logger from "@/utils/logger";

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