import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase env vars missing for loadProjects API');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data, error } = await supabase.from('projects').select('data').order('savedAt', { ascending: false }).limit(200);
    if (error) {
      console.error('Supabase select error', error);
      return res.status(500).json({ error: error.message || error });
    }
    const projects = (data || []).map((r: any) => r.data);
    return res.status(200).json({ projects });
  } catch (err: any) {
    console.error('loadProjects handler error', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
