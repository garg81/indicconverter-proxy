export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    const API_KEY = process.env.GOOGLE_AI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ message: 'API key is not configured' });
    }

    // YEH LINE AB THEEK KAR DI GAYI HAI
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
    
    try {
        const googleResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const data = await googleResponse.json();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        res.status(200).json(data);

    } catch (error) {
        res.status(500).json({ message: 'Error forwarding request to Google AI', error: error.message });
    }
}
