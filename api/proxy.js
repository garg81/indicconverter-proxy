export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { keyIndex, prompt } = req.body;
        const keyName = `GEMINI_API_KEY_${keyIndex}`;
        const API_KEY = process.env[keyName];

        if (!API_KEY) return res.status(500).json({ message: `Key ${keyIndex} not found` });

        // Hum wahi URL use karenge jo aapke tester mein chal raha hai
        const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        
        const googleResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY  // <--- YEH WAHI HEADER HAI JO TESTER MEIN CHAL RAHA HAI
            },
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
