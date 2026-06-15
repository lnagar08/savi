import axios from 'axios';

const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY; 
const BASE_URL = '/api-fred/fred/series/observations';

async function fetchMarketCurves() {
    try {
        // 1. SONIA Rate (Latest: 3.73%)
       
        const soniaRes = await axios.get(BASE_URL, {
            params: {
                series_id: 'IUDSOIA',
                api_key: FRED_API_KEY,
                file_type: 'json',
                sort_order: 'desc',
                limit: 1
            }
        });
        
        // 2. UK 10Y Gilt Yield (Latest: ~5.11%)
        /*const giltRes = await axios.get(BASE_URL, {
            params: {
                series_id: 'IUDMNZA', // UK 10Y Yield series
                api_key: FRED_API_KEY,
                file_type: 'json',
                sort_order: 'desc',
                limit: 1
            }
        });*/

        const inflationRes = await axios.get(BASE_URL, {
            params: {
                series_id: 'T10YIE', // Breakeven Inflation Rate
                api_key: FRED_API_KEY,
                file_type: 'json',
                sort_order: 'desc',
                limit: 1
            }
        });

        const soniaRate = soniaRes.data.observations[0];
        //const giltYield = giltRes.data.observations[0];
       const inflationRate = inflationRes.data.observations[0]; 

        return {
            soniaRate,
            giltYield: 0.42,
            inflationRate,
            lastUpdated: new Date().toISOString()
        };
    } catch (error: any) {
        console.error("Error fetching market data:", error.message);
        return { soniaRate: 3.73, giltYield: 0.42, inflationRate: 2.0, lastUpdated: null };
    }
}

export default fetchMarketCurves;