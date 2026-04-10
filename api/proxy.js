export default async function handler(req, res) {
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
        const { keyIndex, prompt } = req.body;

        if (!keyIndex || !prompt) {
            return res.status(400).json({ message: 'Missing keyIndex or prompt' });
        }

        const keyName = `GEMINI_API_KEY_${keyIndex}`;
        const API_KEY = process.env[keyName];

        if (!API_KEY) {
            return res.status(500).json({ message: `Key ${keyName} not found` });
        }

        // MAINE YAHAN 1.5-FLASH KAR DIYA HAI JO SAHI MODEL HAI
        const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const googleResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }] 
            }),
        });

        const data = await googleResponse.json();
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
}
