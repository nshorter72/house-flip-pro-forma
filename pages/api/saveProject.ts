import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase env vars missing for saveProject API');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    // ensure an id exists
    const id = payload.id || `project_${Date.now()}`;
    const savedAt = payload.savedAt || new Date().toISOString();
    const row = {
      id,
      name: payload.name || (payload.inputs && payload.inputs.projectName) || 'Untitled',
      savedAt,
      data: payload
    };

    const { error } = await supabase.from('projects').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert error', error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(200).json({ ok: true, id });
  } catch (err: any) {
    console.error('saveProject handler error', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
