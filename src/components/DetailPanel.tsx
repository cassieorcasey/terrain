import { useEffect, useState, type CSSProperties } from 'react';
import { Drawer } from 'vaul';
import { ArrowUpRight, X } from 'lucide-react';
import { nid, type Graph } from '../lib/graph';
import { ROLE_LABEL, STATUS_LABEL, type Stack } from '../lib/types';
import { categoryIcon, faviconUrl, hostOf, initials } from './icons';

interface Props {
  id: string | null;
  graph: Graph;
  stack: Stack;
  isDesktop: boolean;
  onSelect(id: string | null): void;
}

const SNAPS = [0.35, 0.85];

/**
 * Panel detail: panel kaca di kanan pada laptop, bottom sheet (snap 35% dan 85%) di iPhone.
 * Non-modal, jadi peta di belakangnya tetap bisa digeser dan diketuk.
 */
export function DetailPanel({ id, graph, stack, isDesktop, onSelect }: Props) {
  const [shown, setShown] = useState(id);
  useEffect(() => { if (id) setShown(id); }, [id]);
  const view = id ?? shown;
  const [snap, setSnap] = useState<number | string | null>(SNAPS[0]);
  useEffect(() => { if (id) setSnap(SNAPS[0]); }, [id]);

  return (
    <Drawer.Root
      open={!!id}
      onOpenChange={o => { if (!o) onSelect(null); }}
      direction={isDesktop ? 'right' : 'bottom'}
      modal={false}
      {...(isDesktop ? {} : { snapPoints: SNAPS, activeSnapPoint: snap, setActiveSnapPoint: setSnap })}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={`sheet ${isDesktop ? 'sheet-right' : 'sheet-bottom'}`}
          style={isDesktop ? ({ '--initial-transform': 'calc(100% + 16px)' } as CSSProperties) : undefined}
          aria-describedby={undefined}
        >
          {!isDesktop && <div className="sheet-handle" aria-hidden="true" />}
          {view && (
            <div className={`sheet-scroll${!isDesktop && snap !== SNAPS[1] ? ' peek' : ''}`} key={view}>
              <Body id={view} graph={graph} stack={stack} onSelect={onSelect} />
            </div>
          )}
          <Drawer.Close className="sheet-close" aria-label="Tutup panel"><X size={16} /></Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function Body({ id, graph, stack, onSelect }: { id: string; graph: Graph; stack: Stack; onSelect: Props['onSelect'] }) {
  const n = graph.byId.get(id);
  if (!n) return null;
  if (n.kind === 'tool') return <ToolBody toolId={n.ref} stack={stack} onSelect={onSelect} />;
  if (n.kind === 'model') return <ModelBody modelId={n.ref} stack={stack} onSelect={onSelect} />;
  return <NeedBody needId={n.ref} stack={stack} onSelect={onSelect} />;
}

/* ───────── Tool ───────── */

function ToolBody({ toolId, stack, onSelect }: { toolId: string; stack: Stack; onSelect: Props['onSelect'] }) {
  const tool = stack.tools.find(t => t.id === toolId)!;
  const cats = new Map(stack.categories.map(c => [c.id, c]));
  const order = new Map(stack.categories.map(c => [c.id, c.row * 2 + c.col]));
  const placements = stack.placements
    .filter(p => p.toolId === toolId)
    .sort((a, b) => order.get(a.categoryId)! - order.get(b.categoryId)!);
  const models = stack.models.filter(m => m.providerId === toolId);
  const directNeeds = stack.targets.filter(t => t.toolId === toolId);
  const host = hostOf(tool.url);

  return (
    <>
      <header className="sheet-head">
        <div className="sheet-hero">
          <ToolBadge name={tool.name} url={tool.url} />
          <div>
            <Drawer.Title className="sheet-title">{tool.name}</Drawer.Title>
            <p className="sheet-meta">
              {placements.length > 1 ? `Hub · ${placements.length} wilayah` : cats.get(placements[0]?.categoryId)?.name}
              {tool.status !== 'aktif' && <span className={`status status-${tool.status}`}>{STATUS_LABEL[tool.status]}</span>}
            </p>
          </div>
        </div>
        {host && (
          <a className="ext-link" href={tool.url!} target="_blank" rel="noopener noreferrer">
            {host}<ArrowUpRight size={14} />
          </a>
        )}
        {tool.note && <p className="sheet-note">{tool.note}</p>}
      </header>

      <section className="sheet-section">
        <h3>{placements.length > 1 ? `Peran di ${placements.length} wilayah` : 'Peran'}</h3>
        <div className="roles">
          {placements.map(p => {
            const c = cats.get(p.categoryId);
            const Icon = categoryIcon(c?.icon ?? '');
            const provided = p.categoryId === 'study' ? models : [];
            return (
              <article key={p.categoryId} className="role-card" data-cat={p.categoryId}>
                <p className="role-cat"><Icon size={14} strokeWidth={1.8} />{c?.name}</p>
                {(p.displayName || p.group) && (
                  <p className="role-group">{[p.displayName, p.group].filter(Boolean).join(' · ')}</p>
                )}
                {p.description && <p className="role-desc">{p.description}</p>}
                {p.workflows.length > 0 && (
                  <ul className="flows">
                    {p.workflows.map(w => <li key={w}>{w}</li>)}
                  </ul>
                )}
                {provided.length > 0 && (
                  <div className="chips">
                    {provided.map(m => (
                      <button key={m.id} type="button" className="chip-model" onClick={() => onSelect(nid.model(m.id))}>
                        {m.family}<span>{m.version}</span>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {directNeeds.length > 0 && (
        <section className="sheet-section">
          <h3>Ditunjuk langsung oleh kebutuhan</h3>
          <ul className="links">
            {directNeeds.map(t => {
              const need = stack.needs.find(n => n.id === t.needId)!;
              return (
                <li key={t.needId}>
                  <button type="button" className="link-row" onClick={() => onSelect(nid.need(need.id))}>
                    <span>{need.name}</span><span className={`role role-${t.role}`}>{ROLE_LABEL[t.role]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function ToolBadge({ name, url }: { name: string; url: string | null }) {
  const [broken, setBroken] = useState(false);
  const icon = faviconUrl(url);
  return (
    <span className="tool-badge" aria-hidden="true">
      {icon && !broken ? <img src={icon} alt="" onError={() => setBroken(true)} /> : initials(name)}
    </span>
  );
}

/* ───────── Model ───────── */

function ModelBody({ modelId, stack, onSelect }: { modelId: string; stack: Stack; onSelect: Props['onSelect'] }) {
  const m = stack.models.find(x => x.id === modelId)!;
  const provider = stack.tools.find(t => t.id === m.providerId);
  const uses = stack.targets.filter(t => t.modelId === modelId);
  return (
    <>
      <header className="sheet-head">
        <p className="sheet-eyebrow">Model</p>
        <Drawer.Title className="sheet-title">
          {m.family} <span className="version-badge">{m.version}</span>
        </Drawer.Title>
        {m.status !== 'aktif' && <p className="sheet-meta"><span className={`status status-${m.status}`}>{STATUS_LABEL[m.status]}</span></p>}
      </header>
      {provider && (
        <section className="sheet-section">
          <h3>Tersedia di</h3>
          <button type="button" className="link-row tool-row" onClick={() => onSelect(nid.tool(provider.id))}>
            <ToolBadge name={provider.name} url={provider.url} /><span>{provider.name}</span>
          </button>
        </section>
      )}
      <section className="sheet-section">
        <h3>Dipakai untuk</h3>
        <ul className="links">
          {uses.map(t => {
            const need = stack.needs.find(n => n.id === t.needId)!;
            return (
              <li key={t.needId}>
                <button type="button" className="link-row" onClick={() => onSelect(nid.need(need.id))}>
                  <span>{need.name}{t.note && <small>{t.note}</small>}</span>
                  <span className={`role role-${t.role}`}>{ROLE_LABEL[t.role]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/* ───────── Kebutuhan ───────── */

function NeedBody({ needId, stack, onSelect }: { needId: string; stack: Stack; onSelect: Props['onSelect'] }) {
  const need = stack.needs.find(n => n.id === needId)!;
  const targets = stack.targets.filter(t => t.needId === needId).sort((a, b) => a.sort - b.sort);
  return (
    <>
      <header className="sheet-head">
        <p className="sheet-eyebrow">Kebutuhan</p>
        <Drawer.Title className="sheet-title">{need.name}</Drawer.Title>
      </header>
      <section className="sheet-section">
        <h3>Pakai</h3>
        <ul className="paths">
          {targets.map(t => {
            const m = t.modelId ? stack.models.find(x => x.id === t.modelId) : null;
            const tool = stack.tools.find(x => x.id === (m ? m.providerId : t.toolId));
            return (
              <li key={(t.modelId ?? t.toolId)!} className="path">
                <span className={`role role-${t.role}`}>{ROLE_LABEL[t.role]}</span>
                <div className="path-steps">
                  {m && (
                    <button type="button" className="chip-model" onClick={() => onSelect(nid.model(m.id))}>
                      {m.family}<span>{m.version}</span>
                    </button>
                  )}
                  {m && tool && <span className="path-arrow" aria-label="di">→</span>}
                  {tool && (
                    <button type="button" className="chip-tool" onClick={() => onSelect(nid.tool(tool.id))}>
                      <ToolBadge name={tool.name} url={tool.url} />{tool.name}
                    </button>
                  )}
                </div>
                {t.note && <p className="path-note">{t.note}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
