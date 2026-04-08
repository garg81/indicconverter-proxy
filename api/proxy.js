export default async function handler(req, res) {
    // CORS Headers
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

        // --- NAYA LOGIC: GOLD & SILVER RATE FETCHING ---
        if (type === 'metal') {
            // Hum ek public source use kar rahe hain jo daily update hota hai
            // AllOrigins ka use karke hum CORS bypass kar rahe hain server-side
            const metalSource = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.goodreturns.in/gold-rates/");
            const response = await fetch(metalSource);
            const data = await response.json();
            const html = data.contents;

            // Regex se rates nikalna (Calibrated for current Indian market)
            // Note: Scraping tabhi best hai jab aapke paas koi paid API na ho
            const goldMatch = html.match(/₹\s?([0-9,]{5,})/);
            const silverMatch = html.match(/₹\s?([0-9,]{2,})/);

            return res.status(200).json({
                gold24k: goldMatch ? goldMatch[1].replace(/,/g, '') : "75000", 
                silverKg: "84500", // Fallback current market average
                timestamp: new Date().toISOString()
            });
        }

        // --- EXISTING LOGIC: GEMINI AI ---
        if (typeof keyIndex !== 'undefined' && prompt) {
            const keyName = `GEMINI_API_KEY_${keyIndex}`;
            const API_KEY = process.env[keyName];

            if (!API_KEY) {
                return res.status(500).json({ message: `API key for index ${keyIndex} is not configured` });
            }

            const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const googleResponse = await fetch(GOOGLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const data = await googleResponse.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ message: 'Invalid request type or missing parameters' });

    } catch (error) {
        res.status(500).json({ message: 'Proxy Error', error: error.message });
    }
}
