// Vercel Serverless Function — Email Webhook Endpoint
// Emails go to the "triagem" queue (user must approve before they become items)

// In-memory store won't persist in serverless, so this endpoint
// returns the classified data for the client to store.
// The client polls this endpoint or receives via Push.

// For a full solution, use Vercel KV or a simple JSON store.
// This is a simplified version that works with client-side polling.

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, source, subject, from } = req.body;

    if (!text && !subject) {
      return res.status(400).json({ error: 'Missing text or subject' });
    }

    const content = [subject, text].filter(Boolean).join(' — ');

    // Store in Vercel KV if available, otherwise return for client processing
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: content.slice(0, 500),
      source: source || 'email',
      from: from || 'unknown',
      received_at: new Date().toISOString(),
      status: 'pending', // Goes to triagem, not directly to items
    };

    // If Vercel KV is configured (env var KV_REST_API_URL exists)
    if (process.env.KV_REST_API_URL) {
      const { kv } = await import('@vercel/kv');
      // Store in a list, max 50 pending items
      await kv.lpush('triagem', JSON.stringify(item));
      await kv.ltrim('triagem', 0, 49);
    }

    return res.status(200).json({
      success: true,
      message: 'Item added to triagem queue',
      item,
    });
  } catch (error) {
    console.error('Capture error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
