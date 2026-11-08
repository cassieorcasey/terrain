import { forceLink, forceSimulation, type SimulationNodeDatum } from 'd3-force';
import type { Category, NodeKind, Role, Stack } from './types';

/* ───────── Ukuran node ───────── */

export const TOOL_R = 22;
export const HUB_R = 26;
const LINE_H = 15;

/** Perkiraan lebar teks Inter 12px, cukup untuk tabrakan dan pembungkus label. */
export function textWidth(s: string, size = 12, weight = 500) {
  let w = 0;
  for (const ch of s) {
    if ('il.,:;|!\'"'.includes(ch)) w += 0.28;
    else if ('ftjr/() '.includes(ch)) w += 0.36;
    else if ('mwMW'.includes(ch)) w += 0.86;
    else if (ch >= 'A' && ch <= 'Z') w += 0.66;
    else if (ch >= '0' && ch <= '9') w += 0.58;
    else w += 0.55;
  }
  return w * size * (weight >= 600 ? 1.04 : 1);
}

/** Bungkus label jadi paling banyak dua baris. */
export function wrapLabel(s: string, max = 13): string[] {
  if (s.length <= max) return [s];
  const slash = s.indexOf(' / ');
  if (slash > 0) return [s.slice(0, slash), s.slice(slash + 1).trim()];
  const words = s.split(' ');
  let a = '';
  for (const w of words) {
    if (a && (a + ' ' + w).length > max) break;
    a = a ? a + ' ' + w : w;
  }
  const b = s.slice(a.length).trim();
  return b ? [a, b] : [a];
}

export function wrapNeed(s: string, maxW = 138): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && textWidth(next, 12.5) > maxW) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ───────── Tipe graf ───────── */

export interface GNode extends SimulationNodeDatum {
  id: string;
  kind: NodeKind | 'label';
  ref: string;
  label: string[];
  regions: string[];
  hub: boolean;
  dicoba: boolean;
  r: number;     // jari-jari gelembung (tool)
  w: number;     // kotak tabrakan
  h: number;
  dy: number;    // pusat kotak relatif terhadap (x, y)
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  kx: number;     // kekuatan tarikan ke jangkar per sumbu
  ky: number;
  group: string | null;
}

export interface GEdge {
  id: string;
  kind: 'target' | 'provider' | 'bridge';
  a: string;
  b: string;      // untuk bridge: id pulau
  role?: Role;
}

export interface Island {
  cat: Category;
  cx: number;
  cy: number;
  R: number;
  harm: [number, number][]; // [amplitudo, fase] untuk harmonik 2, 3, 5
  path: string;
  out: [number, number];    // arah keluar (menjauhi pusat canvas)
  groups: { name: string; x: number; y: number; lines: string[] }[];
}

export interface Graph {
  nodes: GNode[];
  byId: Map<string, GNode>;
  edges: GEdge[];
  islands: Island[];
  islandById: Map<string, Island>;
  bounds: { x0: number; y0: number; x1: number; y1: number };
}

export const nid = {
  tool: (id: string) => `t:${id}`,
  model: (id: string) => `m:${id}`,
  need: (id: string) => `n:${id}`,
  island: (id: string) => `i:${id}`,
};

export const islandOf = (selected: string | null) => (selected?.startsWith('i:') ? selected.slice(2) : null);

/** Semua anggota satu wilayah: tool di daratan, hub yang memakainya, dan (Study) model serta kebutuhan. */
export function islandMembers(g: Graph, cat: string) {
  return g.nodes.filter(n => n.regions.includes(cat));
}

export function relatedIsland(g: Graph, cat: string) {
  const nodes = new Set(islandMembers(g, cat).map(n => n.id));
  const edges = new Set<string>();
  for (const e of g.edges) {
    if (e.kind === 'bridge' ? e.b === cat : nodes.has(e.a) && nodes.has(e.b)) edges.add(e.id);
  }
  return { nodes, edges };
}

/* ───────── Acak deterministik ───────── */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────── Pulau ───────── */

const HARMONICS = [2, 3, 5];

export function islandRadius(is: Pick<Island, 'R' | 'harm'>, theta: number) {
  let f = 1;
  is.harm.forEach(([a, p], i) => { f += a * Math.cos(HARMONICS[i] * theta + p); });
  return is.R * f;
}

function islandPath(is: Pick<Island, 'R' | 'harm' | 'cx' | 'cy'>) {
  const N = 64;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = islandRadius(is, t);
    pts.push([is.cx + r * Math.cos(t), is.cy + r * Math.sin(t)]);
  }
  // Catmull-Rom tertutup → Bezier kubik, supaya garis pantainya halus.
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Titik di garis pantai pulau pada arah menuju (x, y). */
export function shorePoint(is: Island, x: number, y: number): [number, number] {
  const t = Math.atan2(y - is.cy, x - is.cx);
  const r = islandRadius(is, t);
  return [is.cx + r * Math.cos(t), is.cy + r * Math.sin(t)];
}

/* ───────── Merapatkan pulau ───────── */

/**
 * Pulau saling didorong sampai jarak antarpantai minimal STRAIT, lalu ditarik ke pusat.
 * Kuadran tiap pulau (baris/kolom 2x2) tetap terjaga.
 */
function packIslands(islands: Island[]) {
  const reach = (is: Island) => is.R * 1.06;
  for (let it = 0; it < 300; it++) {
    for (const is of islands) { is.cx *= 0.985; is.cy *= 0.985; }
    for (let i = 0; i < islands.length; i++) {
      for (let j = i + 1; j < islands.length; j++) {
        const a = islands[i], b = islands[j];
        const dx = b.cx - a.cx, dy = b.cy - a.cy;
        const d = Math.hypot(dx, dy) || 1;
        const min = reach(a) + reach(b) + STRAIT;
        if (d >= min) continue;
        const push = (min - d) / 2;
        a.cx -= (dx / d) * push; a.cy -= (dy / d) * push;
        b.cx += (dx / d) * push; b.cy += (dy / d) * push;
      }
    }
    for (const is of islands) {
      const sx = is.cat.col === 0 ? -1 : 1, sy = is.cat.row === 0 ? -1 : 1;
      if (is.cx * sx < STRAIT / 2) is.cx = sx * STRAIT / 2;
      if (is.cy * sy < STRAIT / 2) is.cy = sy * STRAIT / 2;
    }
  }
  // Arah keluar = menjauhi titik tengah keempat pulau.
  const mx = islands.reduce((s, i) => s + i.cx, 0) / islands.length;
  const my = islands.reduce((s, i) => s + i.cy, 0) / islands.length;
  for (const is of islands) {
    const dx = is.cx - mx, dy = is.cy - my, d = Math.hypot(dx, dy) || 1;
    is.out = [dx / d, dy / d];
  }
}

/* ───────── Membangun graf ───────── */

const STRAIT = 110; // lebar selat antarpulau

export function buildGraph(s: Stack): Graph {
  const placementsByTool = new Map<string, typeof s.placements>();
  for (const p of [...s.placements].sort((a, b) => a.sort - b.sort)) {
    if (!placementsByTool.has(p.toolId)) placementsByTool.set(p.toolId, []);
    placementsByTool.get(p.toolId)!.push(p);
  }

  const nodes: GNode[] = [];

  for (const t of s.tools) {
    const ps = placementsByTool.get(t.id) ?? [];
    const regions = [...new Set(ps.map(p => p.categoryId))];
    const hub = regions.length > 1;
    const r = hub ? HUB_R : TOOL_R;
    const label = wrapLabel(t.name);
    const w = Math.max(r * 2 + 10, ...label.map(l => textWidth(l) + 10));
    const h = r * 2 + 6 + label.length * LINE_H;
    nodes.push({
      id: nid.tool(t.id), kind: 'tool', ref: t.id, label, regions, hub, dicoba: t.status === 'dicoba',
      r, w, h, dy: h / 2 - r, x: 0, y: 0, anchorX: 0, anchorY: 0, kx: 0.06, ky: 0.06,
      group: regions.length === 1 ? ps[0].group : null,
    });
  }

  const study = s.categories.some(c => c.id === 'study') ? ['study'] : [];
  for (const m of s.models) {
    const w = textWidth(m.family, 12.5, 600) + textWidth(m.version, 11.5, 600) + 40;
    nodes.push({
      id: nid.model(m.id), kind: 'model', ref: m.id, label: [m.family, m.version], regions: study, hub: false,
      dicoba: m.status === 'dicoba', r: 0, w: w + 8, h: 38, dy: 0, x: 0, y: 0, anchorX: 0, anchorY: 0, kx: 0.06, ky: 0.06, group: null,
    });
  }
  for (const n of s.needs) {
    const label = wrapNeed(n.name);
    const w = Math.max(...label.map(l => textWidth(l, 12.5))) + 26;
    nodes.push({
      id: nid.need(n.id), kind: 'need', ref: n.id, label, regions: study, hub: false, dicoba: false,
      r: 0, w: w + 8, h: label.length * 16 + 26, dy: 0, x: 0, y: 0, anchorX: 0, anchorY: 0, kx: 0.06, ky: 0.06, group: null,
    });
  }

  const byId = new Map(nodes.map(n => [n.id, n]));

  /* Edges */
  const edges: GEdge[] = [];
  for (const m of s.models) {
    if (byId.has(nid.tool(m.providerId)))
      edges.push({ id: `p:${m.id}`, kind: 'provider', a: nid.model(m.id), b: nid.tool(m.providerId) });
  }
  for (const t of s.targets) {
    const b = t.modelId ? nid.model(t.modelId) : nid.tool(t.toolId!);
    if (!byId.has(b)) continue;
    edges.push({ id: `nt:${t.needId}:${b}`, kind: 'target', a: nid.need(t.needId), b, role: t.role });
  }
  for (const n of nodes) {
    if (n.hub) for (const c of n.regions) edges.push({ id: `b:${n.id}:${c}`, kind: 'bridge', a: n.id, b: c });
  }

  /* Pulau: ukuran sesuai luas anggota satu-wilayah */
  const singles = new Map<string, GNode[]>();
  for (const n of nodes) {
    if (n.regions.length !== 1) continue;
    const c = n.regions[0];
    if (!singles.has(c)) singles.set(c, []);
    singles.get(c)!.push(n);
  }

  const islands: Island[] = s.categories.map(cat => {
    const members = singles.get(cat.id) ?? [];
    const groupCount = new Set(members.filter(n => n.kind === 'tool').map(n => n.group ?? '')).size;
    const labelArea = groupCount > 1 && members.every(n => n.kind === 'tool') ? groupCount * 140 * 40 : 0;
    const area = members.reduce((a, n) => a + (n.w + 14) * (n.h + 14), 0) + labelArea;
    const R = Math.max(145, Math.sqrt((area * 1.4) / Math.PI) + 36);
    const rand = rng(hash(cat.id));
    const harm: [number, number][] = [
      [0.035 + rand() * 0.03, rand() * Math.PI * 2],
      [0.02 + rand() * 0.02, rand() * Math.PI * 2],
      [0.01 + rand() * 0.012, rand() * Math.PI * 2],
    ];
    const sx = cat.col === 0 ? -1 : 1;
    const sy = cat.row === 0 ? -1 : 1;
    // Titik awal di diagonal; packIslands merapatkan sambil menjaga selat.
    const off = (STRAIT / 2 + R) * 0.75;
    return { cat, cx: sx * off, cy: sy * off, R, harm, path: '', out: [sx * Math.SQRT1_2, sy * Math.SQRT1_2] as [number, number], groups: [] };
  });
  packIslands(islands);
  for (const is of islands) is.path = islandPath(is);
  const islandById = new Map(islands.map(i => [i.cat.id, i]));

  /* Titik jangkar */
  const labels: GNode[] = [];
  for (const is of islands) {
    const members = singles.get(is.cat.id) ?? [];
    if (members.some(n => n.kind !== 'tool')) anchorFlow(is, members, s);
    else labels.push(...anchorGroups(is, members));
  }
  for (const n of nodes) {
    if (n.regions.length > 1) {
      const isl = n.regions.map(c => islandById.get(c)!).filter(Boolean);
      n.anchorX = isl.reduce((a, i) => a + i.cx, 0) / isl.length;
      n.anchorY = isl.reduce((a, i) => a + i.cy, 0) / isl.length;
      n.kx = n.ky = 0.14;
    } else if (n.regions.length === 0) {
      n.anchorX = 0; n.anchorY = 0;
    }
    const rand = rng(hash(n.id));
    n.x = n.anchorX + (rand() - 0.5) * 60;
    n.y = n.anchorY + (rand() - 0.5) * 60;
  }

  for (const l of labels) { const rand = rng(hash(l.id)); l.x = l.anchorX + (rand() - 0.5) * 20; l.y = l.anchorY; }
  simulate([...nodes, ...labels], edges, islands, islandById);

  // Posisi akhir label kelompok diambil dari node semu yang ikut fisika.
  for (const l of labels) {
    const is = islandById.get(l.regions[0])!;
    const g = is.groups.find(g => g.name === l.ref);
    if (g) { g.x = l.x; g.y = l.y; }
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const is of islands) {
    const R = is.R * 1.15;
    x0 = Math.min(x0, is.cx - R); x1 = Math.max(x1, is.cx + R);
    y0 = Math.min(y0, is.cy - R - 40); y1 = Math.max(y1, is.cy + R + 40);
  }
  for (const n of nodes) {
    x0 = Math.min(x0, n.x - n.w / 2); x1 = Math.max(x1, n.x + n.w / 2);
    y0 = Math.min(y0, n.y - n.h / 2); y1 = Math.max(y1, n.y + n.dy + n.h / 2);
  }

  return { nodes, byId, edges, islands, islandById, bounds: { x0, y0, x1, y1 } };
}

/* ───────── Jangkar di dalam pulau ───────── */

/**
 * Study Tools: tiga kolom kebutuhan → model → tool, mengalir ke arah pusat canvas
 * (ke tool penyedia yang jadi hub di selat). Urutan vertikal memakai barycenter supaya garis jarang bersilangan.
 */
function anchorFlow(is: Island, members: GNode[], s: Stack) {
  const fx = is.cat.col === 0 ? 1 : -1;
  const needs = members.filter(n => n.kind === 'need');
  const models = members.filter(n => n.kind === 'model');
  const tools = members.filter(n => n.kind === 'tool');
  const span = is.R * 1.15;

  const yOf = new Map<string, number>();
  const spread = (list: GNode[], x: number) => {
    const total = list.reduce((a, n) => a + n.h + 10, 0);
    let y = is.cy - Math.min(total, span) / 2;
    const step = Math.min(1, span / Math.max(total, 1));
    for (const n of list) {
      const h = (n.h + 10) * step;
      n.anchorX = x; n.anchorY = y + h / 2; n.kx = 0.22; n.ky = 0.08;
      yOf.set(n.id, n.anchorY);
      y += h;
    }
  };

  spread(needs, is.cx - fx * is.R * 0.5);
  const bary = (n: GNode, ids: string[]) => {
    const ys = ids.map(i => yOf.get(i)).filter((v): v is number => v != null);
    return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : is.cy;
  };
  const modelNeeds = (m: GNode) => s.targets.filter(t => t.modelId === m.ref).map(t => nid.need(t.needId));
  models.sort((a, b) => bary(a, modelNeeds(a)) - bary(b, modelNeeds(b)));
  spread(models, is.cx + fx * is.R * 0.05);
  const toolModels = (t: GNode) => s.models.filter(m => m.providerId === t.ref).map(m => nid.model(m.id));
  tools.sort((a, b) => bary(a, toolModels(a)) - bary(b, toolModels(b)));
  for (const t of tools) {
    t.anchorX = is.cx + fx * is.R * 0.55; t.anchorY = bary(t, toolModels(t)); t.kx = 0.2; t.ky = 0.1;
  }
}

/**
 * Wilayah biasa: tool sekelompok (group_name) dikumpulkan; kelompok disebar di cincin.
 * Label kelompok ikut fisika sebagai node semu supaya tidak menimpa gelembung.
 */
function anchorGroups(is: Island, members: GNode[]): GNode[] {
  const names = [...new Set(members.map(n => n.group ?? ''))];
  if (names.length < 2) {
    for (const n of members) { n.anchorX = is.cx; n.anchorY = is.cy; }
    return [];
  }
  const base = Math.atan2(-1, 0); // mulai dari atas, searah jarum jam
  is.groups = names.map((name, i) => {
    const a = base + (i / names.length) * Math.PI * 2;
    return { name, lines: wrapGroup(name), x: is.cx + Math.cos(a) * is.R * 0.52, y: is.cy + Math.sin(a) * is.R * 0.52 };
  });
  const labels: GNode[] = [];
  for (const g of is.groups) {
    const ms = members.filter(n => (n.group ?? '') === g.name);
    for (const n of ms) { n.anchorX = g.x; n.anchorY = g.y; n.kx = n.ky = 0.13; }
    if (!g.name) continue;
    const w = Math.max(...g.lines.map(l => textWidth(l, 11, 600))) + 8;
    const h = g.lines.length * 13 + 4;
    const lift = Math.sqrt(ms.length) * 34 + h / 2;
    labels.push({
      id: `g:${is.cat.id}:${g.name}`, kind: 'label', ref: g.name, label: g.lines, regions: [is.cat.id],
      hub: false, dicoba: false, r: 0, w, h, dy: 0, x: 0, y: 0,
      anchorX: g.x, anchorY: g.y - lift, kx: 0.13, ky: 0.13, group: g.name,
    });
  }
  return labels;
}

function wrapGroup(s: string): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && textWidth(next, 11, 600) > 128) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ───────── Fisika ───────── */

function simulate(nodes: GNode[], edges: GEdge[], islands: Island[], islandById: Map<string, Island>) {
  const links = edges
    .filter(e => e.kind !== 'bridge')
    .map(e => ({ source: e.a, target: e.b, kind: e.kind }));

  const sim = forceSimulation<GNode>(nodes)
    .stop()
    .alphaDecay(0.012)
    .velocityDecay(0.45)
    .force('link', forceLink<GNode, (typeof links)[number] & { source: string | GNode; target: string | GNode }>(links)
      .id(n => n.id)
      .distance(l => (l.kind === 'provider' ? 120 : 130))
      .strength(l => (l.kind === 'provider' ? 0.05 : 0.07)))
    .force('anchor', (alpha: number) => {
      for (const n of nodes) {
        n.vx! += (n.anchorX - n.x) * n.kx * alpha;
        n.vy! += (n.anchorY - n.y) * n.ky * alpha;
      }
    })
    .force('shore', () => {
      for (const n of nodes) {
        const bx = n.x, by = n.y + n.dy;
        const half = Math.hypot(n.w, n.h) / 2;
        if (n.regions.length === 1) {
          // Tool satu-wilayah tetap di dalam pulaunya.
          const is = islandById.get(n.regions[0])!;
          const dx = bx - is.cx, dy = by - is.cy;
          const d = Math.hypot(dx, dy) || 1;
          const lim = islandRadius(is, Math.atan2(dy, dx)) - half * 0.8 - 6;
          if (d > lim) { n.x -= (dx / d) * (d - lim) * 0.6; n.y -= (dy / d) * (d - lim) * 0.6; }
        } else {
          // Hub mengapung di selat: keluar dari pulau mana pun.
          for (const is of islands) {
            const dx = bx - is.cx, dy = by - is.cy;
            const d = Math.hypot(dx, dy) || 1;
            const lim = islandRadius(is, Math.atan2(dy, dx)) + half * 0.55 + 4;
            if (d < lim) { n.x += (dx / d) * (lim - d) * 0.5; n.y += (dy / d) * (lim - d) * 0.5; }
          }
        }
      }
    })
    .force('collide', () => {
      const pad = 8;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = (b.x) - (a.x);
          const dy = (b.y + b.dy) - (a.y + a.dy);
          const ox = (a.w + b.w) / 2 + pad - Math.abs(dx);
          const oy = (a.h + b.h) / 2 + pad - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          // Dorong di sumbu dengan tumpang tindih terkecil.
          if (ox < oy) {
            const s = (dx < 0 ? -1 : 1) * ox * 0.5;
            a.x -= s; b.x += s;
          } else {
            const s = (dy < 0 ? -1 : 1) * oy * 0.5;
            a.y -= s; b.y += s;
          }
        }
      }
    });

  for (let i = 0; i < 600; i++) sim.tick();
}

/* ───────── Relasi untuk sorotan ───────── */

export function related(g: Graph, id: string) {
  const nodes = new Set<string>([id]);
  const edges = new Set<string>();
  const n = g.byId.get(id);
  if (!n) return { nodes, edges };

  const addNeedPath = (needId: string) => {
    for (const e of g.edges) {
      if (e.kind !== 'target' || e.a !== needId) continue;
      edges.add(e.id); nodes.add(e.b);
      for (const p of g.edges) if (p.kind === 'provider' && p.a === e.b) { edges.add(p.id); nodes.add(p.b); }
    }
  };

  if (n.kind === 'need') addNeedPath(id);
  if (n.kind === 'model') {
    for (const e of g.edges) {
      if (e.kind === 'provider' && e.a === id) { edges.add(e.id); nodes.add(e.b); }
      if (e.kind === 'target' && e.b === id) { edges.add(e.id); nodes.add(e.a); }
    }
  }
  if (n.kind === 'tool') {
    for (const e of g.edges) {
      if (e.kind === 'bridge' && e.a === id) edges.add(e.id);
      if (e.kind === 'provider' && e.b === id) {
        edges.add(e.id); nodes.add(e.a);
        for (const t of g.edges) if (t.kind === 'target' && t.b === e.a) { edges.add(t.id); nodes.add(t.a); }
      }
      if (e.kind === 'target' && e.b === id) { edges.add(e.id); nodes.add(e.a); }
    }
  }
  return { nodes, edges };
}
