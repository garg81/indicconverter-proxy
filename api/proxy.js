export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    // ▼▼▼ YEH TEEN LINES SABSE ZAROORI HAIN ▼▼▼
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // ▲▲▲ YEH TEEN LINES SABSE ZAROORI HAIN ▲▲▲

    try {
        const { keyIndex, prompt } = req.body;

        if (typeof keyIndex === 'undefined' || !prompt) {
            return res.status(400).json({ message: 'Missing keyIndex or prompt in request' });
        }

        const keyName = `GEMINI_API_KEY_${keyIndex}`;
        const API_KEY = process.env[keyName];

        if (!API_KEY) {
            return res.status(500).json({ message: `API key for index ${keyIndex} is not configured` });
        }

        const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
        
        const googleResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await googleResponse.json();
        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: 'Error forwarding request to Google AI', error: error.message });
    }
}
