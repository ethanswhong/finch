export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(500).json({ error: 'Missing ELEVENLABS_API_KEY or agent id.' });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey } }
    );

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: 'ElevenLabs signed URL request failed', detail: body });
    }

    const data = await response.json();
    return res.status(200).json({ signedUrl: data.signed_url });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
