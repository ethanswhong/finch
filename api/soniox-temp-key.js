export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.SONIOX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing SONIOX_API_KEY.' });

  try {
    const response = await fetch('https://api.soniox.com/v1/auth/temporary-api-key', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usage_type: 'transcribe_websocket',
        expires_in_seconds: 300,
        single_use: true,
        max_session_duration_seconds: 1800,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Soniox temporary key request failed', detail: body });
    }
    const data = JSON.parse(body);
    return res.status(200).json({ api_key: data.api_key, expires_at: data.expires_at });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Could not create Soniox temporary key.' });
  }
}
