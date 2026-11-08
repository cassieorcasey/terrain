import Fuse, { type Expression, type FuseResult } from 'fuse.js';
import type { Stack } from './types';
import { nid } from './graph';

export interface Doc {
  id: string;          // id node
  kind: 'tool' | 'model' | 'need';
  name: string;
  extra: string;       // nama lain: display name, keluarga+versi
  group: string[];
  desc: string[];
  flows: string[];
}

export interface Hit {
  id: string;
  kind: Doc['kind'];
  name: string;
  /** Contoh alur kerja atau deskripsi yang cocok, untuk ditampilkan di daftar hasil. */
  snippets: string[];
}

const KEYS = [
  { name: 'name', weight: 3 },
  { name: 'extra', weight: 2 },
  { name: 'desc', weight: 1.4 },
  { name: 'flows', weight: 1 },
  { name: 'group', weight: 0.6 },
];

export function buildIndex(s: Stack) {
  const docs: Doc[] = [];
  for (const t of s.tools) {
    const ps = s.placements.filter(p => p.toolId === t.id);
    docs.push({
      id: nid.tool(t.id), kind: 'tool', name: t.name,
      extra: ps.map(p => p.displayName).filter(Boolean).join(' '),
      group: ps.map(p => p.group).filter((g): g is string => !!g),
      desc: [t.note, ...ps.map(p => p.description)].filter((d): d is string => !!d),
      flows: ps.flatMap(p => p.workflows),
    });
  }
  for (const m of s.models) {
    docs.push({
      id: nid.model(m.id), kind: 'model', name: `${m.family} ${m.version}`, extra: m.family,
      group: [], desc: [], flows: [],
    });
  }
  for (const n of s.needs) {
    const notes = s.targets.filter(t => t.needId === n.id).map(t => t.note).filter((x): x is string => !!x);
    docs.push({ id: nid.need(n.id), kind: 'need', name: n.name, extra: '', group: [], desc: notes, flows: [] });
  }
  return new Fuse(docs, {
    keys: KEYS,
    includeMatches: true,
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.3,
    minMatchCharLength: 2,
    useExtendedSearch: true,
  });
}

/** Setiap kata harus cocok di salah satu kolom, sehingga "konteks panjang" tidak cocok hanya karena "konteks". */
export function search(fuse: Fuse<Doc>, q: string): Hit[] {
  const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
  if (!words.length) return [];
  // Cocok persis dulu ("slack" tidak boleh menangkap "stack"); fuzzy hanya bila tidak ada hasil.
  const query = (fuzzy: boolean): Expression => ({
    $and: words.map(w => ({ $or: KEYS.map(k => ({ [k.name]: fuzzy ? w : `'${w}` })) })),
  });
  let res = fuse.search(query(false));
  if (!res.length) res = fuse.search(query(true));
  return res.slice(0, 12).map(r => ({
    id: r.item.id,
    kind: r.item.kind,
    name: r.item.name,
    snippets: snippets(r),
  }));
}

function snippets(r: FuseResult<Doc>): string[] {
  // Contoh alur kerja lebih berguna daripada deskripsi; tampilkan maksimal dua.
  const ms = r.matches ?? [];
  const pick = (key: string) => ms.filter(m => m.key === key && m.value).map(m => m.value!);
  return [...new Set([...pick('flows'), ...pick('desc')])].slice(0, 2);
}
