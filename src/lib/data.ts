import type { SupabaseClient } from '@supabase/supabase-js';
import seed from '../../data/seed.json';
import type { Category, Model, Need, NeedTarget, Placement, Stack, Status, Role } from './types';

/**
 * Susunan 2x2 untuk mode contoh. Sama dengan hasil scripts/build_seed.py di sql/seed.sql;
 * versi Supabase membaca grid_row/grid_col langsung dari tabel categories.
 */
const DEMO_GRID: Record<string, [0 | 1, 0 | 1]> = {
  study: [0, 0],
  home: [0, 1],
  octopus: [1, 0],
  builder: [1, 1],
};

type SeedTarget = { model?: string; tool?: string; role: string; note?: string };

export function fromSeed(): Stack {
  const categories: Category[] = seed.categories.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    description: (c as { description?: string }).description ?? null,
    row: DEMO_GRID[c.id][0],
    col: DEMO_GRID[c.id][1],
  }));
  const placements: Placement[] = seed.placements.map((p, i) => ({
    toolId: p.tool,
    categoryId: p.category,
    group: p.group ?? null,
    displayName: (p as { display_name?: string }).display_name ?? null,
    description: p.description ?? null,
    workflows: p.workflows,
    sort: i,
  }));
  const models: Model[] = seed.models.map((m, i) => ({
    id: m.id, family: m.family, version: m.version, providerId: m.provider,
    status: m.status as Status, sort: i,
  }));
  const needs: Need[] = seed.needs.map((n, i) => ({ id: n.id, name: n.name, sort: i }));
  const targets: NeedTarget[] = seed.needs.flatMap(n =>
    (n.targets as SeedTarget[]).map((t, j) => ({
      needId: n.id,
      modelId: t.model ?? null,
      toolId: t.tool ?? null,
      role: t.role as Role,
      note: t.note ?? null,
      sort: j,
    })));
  return {
    categories,
    tools: seed.tools.map(t => ({
      id: t.id, name: t.name, url: t.url, note: (t as { note?: string }).note ?? null, status: t.status as Status,
    })),
    placements, models, needs, targets,
  };
}

export async function fromSupabase(sb: SupabaseClient): Promise<Stack> {
  const db = sb.schema('toolstack');
  const [c, t, p, m, n, nt] = await Promise.all([
    db.from('categories').select('*'),
    db.from('tools').select('*'),
    db.from('placements').select('*').order('sort_order'),
    db.from('models').select('*').order('sort_order'),
    db.from('needs').select('*').order('sort_order'),
    db.from('need_targets').select('*').order('sort_order'),
  ]);
  const failed = [c, t, p, m, n, nt].find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  return {
    categories: c.data!.map(r => ({
      id: r.id, name: r.name, icon: r.icon, description: r.description, row: r.grid_row, col: r.grid_col,
    })),
    tools: t.data!.map(r => ({ id: r.id, name: r.name, url: r.url, note: r.note, status: r.status })),
    placements: p.data!.map(r => ({
      toolId: r.tool_id, categoryId: r.category_id, group: r.group_name, displayName: r.display_name,
      description: r.description, workflows: r.workflows ?? [], sort: r.sort_order,
    })),
    models: m.data!.map(r => ({
      id: r.id, family: r.family, version: r.version, providerId: r.provider_tool_id, status: r.status, sort: r.sort_order,
    })),
    needs: n.data!.map(r => ({ id: r.id, name: r.name, sort: r.sort_order })),
    targets: nt.data!.map(r => ({
      needId: r.need_id, modelId: r.model_id, toolId: r.tool_id, role: r.role, note: r.note, sort: r.sort_order,
    })),
  };
}

/** Sembunyikan yang berstatus arsip beserta relasi yang menunjuk ke sana. */
export function withoutArchived(s: Stack): Stack {
  const tools = s.tools.filter(t => t.status !== 'arsip');
  const toolIds = new Set(tools.map(t => t.id));
  const models = s.models.filter(m => m.status !== 'arsip' && toolIds.has(m.providerId));
  const modelIds = new Set(models.map(m => m.id));
  return {
    ...s,
    tools,
    models,
    placements: s.placements.filter(p => toolIds.has(p.toolId)),
    targets: s.targets.filter(t => (t.modelId ? modelIds.has(t.modelId) : toolIds.has(t.toolId!))),
  };
}
