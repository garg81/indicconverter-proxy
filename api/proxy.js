export default async function handler(req, res) {
    // CORS Headers: Browser security ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    try {
        const { type, keyIndex, prompt } = req.body;

        // ==========================================
        // 1. GOLD & SILVER LOGIC (RAPID API)
        // ==========================================
        if (type === 'metal') {
            const rapidResponse = await fetch("https://gold-price-live.p.rapidapi.com/get_metal_prices", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-rapidapi-host": "gold-price-live.p.rapidapi.com",
                    "x-rapidapi-key": "08d0c3d254msh9925de69bfb9c3cp1401b8jsna57c7970d244"
                }
            });
            
            const data = await rapidResponse.json();

            // Calibration: USD Price ko Indian Market (INR + Taxes) mein badalna
            const usdToInr = 88.5; // Current Exchange Rate
            const goldPriceUsd = data.gold_price; // Price per Ounce
            const silverPriceUsd = data.silver_price; // Price per Ounce

            // Formula: (USD / 31.1035) * ExchangeRate * ImportDuty(1.092)
            const goldInrPerGram = (goldPriceUsd / 31.1035) * usdToInr * 1.092;
            const silverInrPerGram = (silverPriceUsd / 31.1035) * usdToInr * 1.12;

            return res.status(200).json({
                gold24k: (goldInrPerGram * 10).toString(), // 10g Rate
                silverKg: (silverInrPerGram * 1000).toString(), // 1kg Rate
                success: true
            });
        }

        // ==========================================
        // 2. EXISTING GEMINI LOGIC
        // ==========================================
        if (typeof keyIndex !== 'undefined' && prompt) {
            const keyName = `GEMINI_API_KEY_${keyIndex}`;
            const API_KEY = process.env[keyName];

            if (!API_KEY) {
                return res.status(500).json({ message: `API key ${keyName} is not configured` });
            }

            const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const googleResponse = await fetch(GOOGLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const aiData = await googleResponse.json();
            return res.status(200).json(aiData);
        }

        return res.status(400).json({ message: 'Missing type="metal" OR prompt parameters' });

    } catch (error) {
        res.status(500).json({ message: 'Proxy Error', error: error.message });
    }
}
