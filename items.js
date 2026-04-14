export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      const items = await kv.lrange('triagem', 0, -1);
      const parsed = items.map(i => typeof i === 'string' ? JSON.parse(i) : i);
      return res.status(200).json({ items: parsed });
    }
    
    return res.status(200).json({ items: [], note: 'KV not configured. Use client-side storage.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
