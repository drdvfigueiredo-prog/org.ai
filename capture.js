import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Simple token auth
  const token = req.headers.authorization?.replace('Bearer ', '') 
    || req.query.token;
  const storedToken = await kv.get('sync-token');
  
  if (!storedToken) {
    // First time: set the token
    if (token && req.method === 'POST' && req.body?.action === 'setup') {
      await kv.set('sync-token', token);
      return res.status(200).json({ success: true, message: 'Token configured' });
    }
    return res.status(200).json({ error: 'Token not configured. Use setup action first.' });
  }
  
  if (token !== storedToken) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    // ─── GET: Read all items (Claude fetches this) ───
    if (req.method === 'GET') {
      const items = await kv.get('items') || [];
      const filter = req.query.filter; // 'unclassified', 'all'
      
      if (filter === 'unclassified') {
        const unclassified = items.filter(i => !i.ai_classified && !i.done);
        return res.status(200).json({ 
          items: unclassified, 
          total: items.length,
          pending: unclassified.length 
        });
      }
      
      return res.status(200).json({ items, total: items.length });
    }

    // ─── POST: PWA pushes items to server ───
    if (req.method === 'POST') {
      const { items: newItems, action } = req.body;
      
      if (action === 'sync') {
        // Full sync from PWA: merge with existing
        const existing = await kv.get('items') || [];
        const existingIds = new Set(existing.map(i => i.id));
        
        // Add new items, update existing ones
        const merged = [...existing];
        for (const item of (newItems || [])) {
          const idx = merged.findIndex(i => i.id === item.id);
          if (idx >= 0) {
            // Update if PWA version is newer
            if (new Date(item.updated_at || item.created_at) > new Date(merged[idx].updated_at || merged[idx].created_at)) {
              merged[idx] = item;
            }
          } else {
            merged.push(item);
          }
        }
        
        await kv.set('items', merged);
        return res.status(200).json({ 
          success: true, 
          synced: merged.length,
          message: `${merged.length} items synced` 
        });
      }
      
      if (action === 'add') {
        // Add single item
        const existing = await kv.get('items') || [];
        existing.push(...(newItems || []));
        await kv.set('items', existing);
        return res.status(200).json({ success: true, total: existing.length });
      }

      return res.status(400).json({ error: 'Missing action (sync or add)' });
    }

    // ─── PUT: Claude pushes classified items back ───
    if (req.method === 'PUT') {
      const { items: classifiedItems } = req.body;
      if (!classifiedItems?.length) {
        return res.status(400).json({ error: 'No items provided' });
      }
      
      const existing = await kv.get('items') || [];
      
      for (const classified of classifiedItems) {
        const idx = existing.findIndex(i => i.id === classified.id);
        if (idx >= 0) {
          existing[idx] = {
            ...existing[idx],
            ...classified,
            ai_classified: true,
            classified_at: new Date().toISOString(),
          };
        }
      }
      
      await kv.set('items', existing);
      return res.status(200).json({ 
        success: true, 
        classified: classifiedItems.length,
        message: `${classifiedItems.length} items classified by Claude` 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
