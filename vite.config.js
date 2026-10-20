import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

async function createSonioxTempKey(apiKey) {
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
  if (!response.ok) throw new Error(body || `Soniox temporary key failed (${response.status})`);
  return JSON.parse(body);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      {
        name: 'soniox-temp-key-local-dev',
        configureServer(server) {
          server.middlewares.use('/api/soniox-temp-key', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            if (!env.SONIOX_API_KEY) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing SONIOX_API_KEY in .env.local' }));
              return;
            }
            try {
              const data = await createSonioxTempKey(env.SONIOX_API_KEY);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ api_key: data.api_key, expires_at: data.expires_at }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Soniox temporary key failed' }));
            }
          });
        },
      },
    ],
  };
});
