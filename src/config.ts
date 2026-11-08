// Project Supabase StudyO, sama dengan Synthesis dan Waypoint.
// Publishable key aman ada di kode publik selama RLS aktif (lihat sql/schema.sql).
export const SUPABASE_URL = 'https://mzeovinagkjvoocbeytj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_jyOphMfcx8BlRhiER8ZRxg_n52XQZgV';

/** ?demo di URL: memakai data/seed.json, tanpa login. */
export const DEMO = new URLSearchParams(location.search).has('demo');
