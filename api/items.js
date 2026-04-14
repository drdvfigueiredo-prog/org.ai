import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  const storedToken = await redis.get('sync-token');

  if (!storedToken) {
    if (token && req.method === 'POST' && req.body?.action === 'setup') {
      await redis.set('sync-token', token);
      return res.status(200).json({ success: true, message: 'Token configured' });
    }
    return res.status(200).json({ error: 'Token not configured' });
  }

  if (token !== storedToken) return res.status(401).json({ error: 'Invalid token' });

  try {
    if (req.method === 'GET') {
      const items = await redis.get('items') || [];
      const filter = req.query.filter;
      if (filter === 'unclassified') {
        const unclassified = items.filter(i => !i.ai_classified && !i.done);
        return res.status(200).json({ items: unclassified, total: items.length, pending: unclassified.length });
      }
      return res.status(200).json({ items, total: items.length });
    }

    if (req.method === 'POST') {
      const { items: newItems, action } = req.body;
      if (action === 'sync') {
        const existing = await redis.get('items') || [];
        const merged = [...existing];
        for (const item of (newItems || [])) {
          const idx = merged.findIndex(i => i.id === item.id);
          if (idx >= 0) {
            if (new Date(item.updated_at || item.created_at) > new Date(merged[idx].updated_at || merged[idx].created_at)) {
              merged[idx] = item;
            }
          } else {
            merged.push(item);
          }
        }
        await redis.set('items', merged);
        return res.status(200).json({ success: true, synced: merged.length });
      }
      if (action === 'add') {
        const existing = await redis.get('items') || [];
        existing.push(...(newItems || []));
        await redis.set('items', existing);
        return res.status(200).json({ success: true, total: existing.length });
      }
      if (action === 'setup') {
        await redis.set('sync-token', token);
        return res.status(200).json({ success: true, message: 'Token updated' });
      }
      return res.status(400).json({ error: 'Missing action' });
    }

    if (req.method === 'PUT') {
      const { items: classifiedItems } = req.body;
      if (!classifiedItems?.length) return res.status(400).json({ error: 'No items' });
      const existing = await redis.get('items') || [];
      for (const c of classifiedItems) {
        const idx = existing.findIndex(i => i.id === c.id);
        if (idx >= 0) existing[idx] = { ...existing[idx], ...c, ai_classified: true, classified_at: new Date().toISOString() };
      }
      await redis.set('items', existing);
      return res.status(200).json({ success: true, classified: classifiedItems.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
