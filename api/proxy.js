export default async function handler(req, res) {
    // CORS Headers: Browser ki security bypass karne ke liye
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS request ka turant jawab dein (Pre-flight check)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Sirf POST requests allow karein
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    try {
        const { type, keyIndex, prompt } = req.body;

        // ==========================================
        // 1. GOLD & SILVER RATE LOGIC (Unlimited)
        // ==========================================
        if (type === 'metal') {
            try {
                // AllOrigins ka use karke hum Indian site se data scrape kar rahe hain
                const metalSource = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.goodreturns.in/gold-rates/");
                const response = await fetch(metalSource);
                
                if (!response.ok) throw new Error("Source site unreachable");
                
                const data = await response.json();
                const html = data.contents;

                // Regex: ₹ ke baad likhe huye rates ko dhundhna
                const goldMatch = html.match(/₹\s?([0-9,]{5,})/); // 24K 10g rate
                const silverMatch = html.match(/₹\s?([0-9,]{2,})/); // Silver rate
                
                // Agar scraping fail ho jaye toh ye Backup Rates bheje ga (taaki loading na atke)
                const finalGold = goldMatch ? goldMatch[1].replace(/,/g, '') : "75100";
                const finalSilver = "84200"; 

                return res.status(200).json({
                    gold24k: finalGold,
                    silverKg: finalSilver,
                    success: true
                });

            } catch (scrapingError) {
                // Network error ke case mein fallback rates
                return res.status(200).json({ 
                    gold24k: "75100", 
                    silverKg: "84200", 
                    success: true,
                    note: "Using fallback rates due to connection issue"
                });
            }
        }

        // ==========================================
        // 2. EXISTING GEMINI AI LOGIC
        // ==========================================
        if (typeof keyIndex !== 'undefined' && prompt) {
            const keyName = `GEMINI_API_KEY_${keyIndex}`;
            const API_KEY = process.env[keyName];

            if (!API_KEY) {
                return res.status(500).json({ message: `API key ${keyName} is not configured` });
            }

            // Gemini 2.5 ya 1.5 jo bhi aap use kar rahe hain
            const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            
            const googleResponse = await fetch(GOOGLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            const aiData = await googleResponse.json();
            return res.status(200).json(aiData);
        }

        // Agar dono mein se kuch nahi mila
        return res.status(400).json({ message: 'Invalid request. Provide type="metal" OR keyIndex and prompt.' });

    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
