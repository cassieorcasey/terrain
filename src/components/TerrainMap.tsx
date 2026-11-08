import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Graph, GEdge, GNode, Island } from '../lib/graph';
import { islandMembers, islandOf, nid, shorePoint } from '../lib/graph';
import type { Stack } from '../lib/types';
import { categoryIcon, faviconUrl, initials } from './icons';

export interface MapHandle {
  fitAll(): void;
  focusIsland(id: string): void;
  focusNode(id: string): void;
}

interface Props {
  ref?: Ref<MapHandle>;
  graph: Graph;
  stack: Stack;
  selected: string | null;
  lit: { nodes: Set<string>; edges: Set<string> } | null;
  litStrong: boolean;          // true saat pencarian: yang tak cocok turun ke 0.15
  padRight: number;            // ruang panel desktop
  padBottom: number;           // ruang bottom sheet
  onSelect(id: string | null): void;
}

/** Di bawah skala ini, label tool disembunyikan dan ketukan di pulau berarti "masuk ke wilayah". */
const FAR = 0.5;

export function TerrainMap({ ref, graph, stack, selected, lit, litStrong, padRight, padBottom, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pads = useRef({ padRight, padBottom });
  pads.current = { padRight, padBottom };

  useEffect(() => {
    const svg = svgRef.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(svg);
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.12, 2.6])
      .clickDistance(5)
      .on('zoom', e => setT(e.transform));
    select(svg).call(z).on('dblclick.zoom', null);
    zoomRef.current = z;
    return () => { ro.disconnect(); select(svg).on('.zoom', null); };
  }, []);

  const fitBox = useCallback((x0: number, y0: number, x1: number, y1: number, maxK = 1.6, animate = true) => {
    const svg = svgRef.current, z = zoomRef.current;
    if (!svg || !z) return;
    const W = svg.clientWidth - pads.current.padRight, H = svg.clientHeight - pads.current.padBottom;
    const top = 72; // ruang untuk bar atas dan pencarian
    const k = Math.min(maxK, (W - 40) / (x1 - x0), (H - top - 72) / (y1 - y0));
    const tx = W / 2 - k * (x0 + x1) / 2;
    const ty = top + (H - top - 48) / 2 - k * (y0 + y1) / 2;
    const target = zoomIdentity.translate(tx, ty).scale(k);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sel = select(svg);
    if (animate && !reduce) sel.transition().duration(650).call(z.transform, target);
    else sel.call(z.transform, target);
  }, []);

  const fitAll = useCallback((animate = true) => {
    const b = graph.bounds;
    fitBox(b.x0, b.y0, b.x1, b.y1, 1.1, animate);
  }, [graph, fitBox]);

  /** Zoom ke satu pulau beserta hub di selatnya, supaya seluruh anggotanya terlihat. */
  const focusIsland = useCallback((id: string) => {
    const is = graph.islandById.get(id);
    if (!is) return;
    const R = is.R * 1.12;
    let x0 = is.cx - R, y0 = is.cy - R - 30, x1 = is.cx + R, y1 = is.cy + R + 30;
    for (const n of islandMembers(graph, id)) {
      x0 = Math.min(x0, n.x - n.w / 2); x1 = Math.max(x1, n.x + n.w / 2);
      y0 = Math.min(y0, n.y + n.dy - n.h / 2); y1 = Math.max(y1, n.y + n.dy + n.h / 2);
    }
    fitBox(x0, y0, x1, y1, 1.4);
  }, [graph, fitBox]);

  const focusNode = useCallback((id: string) => {
    const n = graph.byId.get(id);
    if (!n) return;
    const svg = svgRef.current!;
    const k = Math.max(t.k, 1);
    const W = svg.clientWidth - pads.current.padRight, H = svg.clientHeight - pads.current.padBottom;
    const target = zoomIdentity.translate(W / 2 - k * n.x, 72 + (H - 72) / 2 - k * (n.y + n.dy)).scale(k);
    const sel = select(svg);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) sel.call(zoomRef.current!.transform, target);
    else sel.transition().duration(550).call(zoomRef.current!.transform, target);
  }, [graph, t.k]);

  // Node terpilih yang tertutup panel atau keluar layar digeser ke area yang terlihat.
  useEffect(() => {
    if (!selected) return;
    const n = graph.byId.get(selected), svg = svgRef.current;
    if (!n || !svg) return;
    const sx = t.applyX(n.x), sy = t.applyY(n.y + n.dy);
    const W = svg.clientWidth - padRight, H = svg.clientHeight - padBottom;
    const m = 60;
    if (sx > m && sx < W - m && sy > 90 && sy < H - m) return;
    focusNode(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, padRight, padBottom]);

  useImperativeHandle(ref,() => ({ fitAll: () => fitAll(), focusIsland, focusNode }), [fitAll, focusIsland, focusNode]);

  // Tampilan awal: seluruh peta.
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !size.w) return;
    fitted.current = true;
    fitAll(false);
  }, [size.w, fitAll]);

  const far = t.k < FAR;
  const toolsById = useMemo(() => new Map(stack.tools.map(x => [x.id, x])), [stack]);
  const modelsById = useMemo(() => new Map(stack.models.map(x => [x.id, x])), [stack]);

  const dimNode = (id: string) => (lit && !lit.nodes.has(id) ? (litStrong ? 0.15 : 0.32) : 1);

  function tapNode(n: GNode) {
    if (far && n.regions.length === 1) { focusIsland(n.regions[0]); return; }
    onSelect(selected === n.id ? null : n.id);
  }

  return (
    <svg
      ref={svgRef}
      className={`map${far ? ' far' : ''}`}
      role="application"
      aria-label="Peta wilayah My AI Tool Stack. Seret untuk menggeser, cubit atau scroll untuk zoom."
      onClick={e => { if (e.target === e.currentTarget) onSelect(null); }}
    >
      <g transform={t.toString()}>
        {graph.islands.map(is => (
          <IslandShape key={is.cat.id} is={is} k={t.k} far={far}
            count={islandMembers(graph, is.cat.id).filter(n => n.kind === 'tool').length}
            selected={islandOf(selected) === is.cat.id}
            dim={!!lit && islandOf(selected) !== is.cat.id && !!islandOf(selected)}
            onLand={() => (far ? focusIsland(is.cat.id) : onSelect(null))}
            onName={() => { onSelect(nid.island(is.cat.id)); setTimeout(() => focusIsland(is.cat.id), 30); }} />
        ))}

        <g className="edges">
          {graph.edges.map(e => (
            <EdgePath key={e.id} e={e} g={graph}
              on={!!lit?.edges.has(e.id)} dim={!!lit && !lit.edges.has(e.id)} />
          ))}
        </g>

        {!far && graph.islands.flatMap(is => is.groups.filter(gr => gr.name).map(gr => (
          <text key={is.cat.id + gr.name} className="group-label" data-cat={is.cat.id} x={gr.x}
            y={gr.y - ((gr.lines.length - 1) * 13) / 2} textAnchor="middle" style={{ opacity: lit ? 0.35 : 1 }}>
            {gr.lines.map((l, i) => <tspan key={i} x={gr.x} dy={i ? 13 : '0.35em'}>{l}</tspan>)}
          </text>
        )))}

        <g className="nodes">
          {graph.nodes.map(n => (
            <NodeShape key={n.id} n={n}
              opacity={dimNode(n.id)}
              selected={selected === n.id}
              tool={n.kind === 'tool' ? toolsById.get(n.ref) : undefined}
              model={n.kind === 'model' ? modelsById.get(n.ref) : undefined}
              onTap={() => tapNode(n)} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/* ───────── Pulau ───────── */

interface IslandProps {
  is: Island; k: number; far: boolean; count: number; selected: boolean; dim: boolean;
  onLand(): void; onName(): void;
}

function IslandShape({ is, k, far, count, selected, dim, onLand, onName }: IslandProps) {
  const Icon = categoryIcon(is.cat.icon);
  const iconSize = is.R * 0.62;
  const fontSize = Math.max(19, 14 / k);
  const sub = fontSize * 0.62;
  const top = is.cat.row === 0;
  const labelY = top ? is.cy - is.R * 1.09 - fontSize * 0.45 - sub * 1.3 : is.cy + is.R * 1.09 + fontSize * 1.05;
  return (
    <g className={`island${selected ? ' selected' : ''}${dim ? ' dim' : ''}`} data-cat={is.cat.id}>
      <path className="island-fill" d={is.path}
        onClick={e => { e.stopPropagation(); onLand(); }}
        aria-hidden="true" />
      <g className="island-mark" transform={`translate(${is.cx - iconSize / 2},${is.cy - iconSize / 2})`} aria-hidden="true">
        <Icon width={iconSize} height={iconSize} strokeWidth={1.1} absoluteStrokeWidth={false} />
      </g>
      <g className="island-name" role="button" tabIndex={0} aria-pressed={selected}
        aria-label={`${is.cat.name}, ${count} tool. Tampilkan semua anggotanya`}
        onClick={e => { e.stopPropagation(); onName(); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onName(); } }}>
        <text className="island-label" x={is.cx} y={labelY} textAnchor="middle" style={{ fontSize }}>
          {is.cat.name}
        </text>
        <text className="island-count" x={is.cx} y={labelY + sub * 1.45} textAnchor="middle" style={{ fontSize: sub }}>
          {count} tool
        </text>
      </g>
    </g>
  );
}

/* ───────── Garis ───────── */

function EdgePath({ e, g, on, dim }: { e: GEdge; g: Graph; on: boolean; dim: boolean }) {
  const a = g.byId.get(e.a)!;
  let x1 = a.x, y1 = a.y;
  let x2: number, y2: number;
  if (e.kind === 'bridge') {
    const is = g.islandById.get(e.b);
    if (!is) return null;
    [x2, y2] = shorePoint(is, a.x, a.y);
    // Masuk sedikit ke daratan supaya terlihat seperti jembatan.
    const dx = is.cx - x2, dy = is.cy - y2, d = Math.hypot(dx, dy);
    x2 += (dx / d) * 18; y2 += (dy / d) * 18;
  } else {
    const b = g.byId.get(e.b)!;
    x2 = b.x; y2 = b.y + (b.kind === 'tool' ? 0 : b.dy);
    y1 = a.y + a.dy;
  }
  // Kurva Bezier kuadratik dengan lengkung kecil ke samping.
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const bend = e.kind === 'bridge' ? 0 : 0.12;
  const cx = mx - dy * bend, cy = my + dx * bend;
  return (
    <path
      className={`edge edge-${e.kind}${e.role ? ' role-' + e.role : ''}${on ? ' on' : ''}${dim ? ' dim' : ''}`}
      d={`M${x1},${y1}Q${cx},${cy} ${x2},${y2}`}
    />
  );
}

/* ───────── Node ───────── */

interface NodeProps {
  n: GNode;
  opacity: number;
  selected: boolean;
  tool?: Stack['tools'][number];
  model?: Stack['models'][number];
  onTap(): void;
}

function NodeShape({ n, opacity, selected, tool, model, onTap }: NodeProps) {
  const [broken, setBroken] = useState(false);
  const icon = tool ? faviconUrl(tool.url) : null;
  const name = tool?.name ?? (model ? `${model.family} ${model.version}` : n.label.join(' '));
  const common = {
    className: `node node-${n.kind}${n.hub ? ' hub' : ''}${n.dicoba ? ' dicoba' : ''}${selected ? ' selected' : ''}`,
    transform: `translate(${n.x},${n.y})`,
    style: { opacity },
    role: 'button',
    tabIndex: 0,
    'aria-pressed': selected,
    'aria-label': `${name}${n.dicoba ? ' (dicoba)' : ''}`,
    'data-node': n.id,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onTap(); },
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } },
  };

  if (n.kind === 'tool' && tool) {
    const s = n.r * 1.1;
    return (
      <g {...common}>
        <g className="lift">
          <circle className="bubble" r={n.r} />
          {n.hub && <circle className="hub-ring" r={n.r + 4} />}
          {icon && !broken
            ? <image href={icon} x={-s / 2} y={-s / 2} width={s} height={s} onError={() => setBroken(true)} />
            : <text className="bubble-initials" dy="0.35em" textAnchor="middle">{initials(tool.name)}</text>}
        </g>
        <text className="node-label" y={n.r + 15} textAnchor="middle">
          {n.label.map((l, i) => <tspan key={i} x={0} dy={i ? 14.5 : 0}>{l}</tspan>)}
        </text>
      </g>
    );
  }

  if (n.kind === 'model' && model) {
    const w = n.w - 8, h = 28;
    const vw = Math.max(26, model.version.length * 7.6 + 14);
    return (
      <g {...common}>
        <g className="lift">
          <rect className="capsule" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />
          <path className="capsule-badge" d={`M${w / 2 - vw},${-h / 2}h${vw - h / 2}a${h / 2},${h / 2} 0 0 1 0,${h}h${-(vw - h / 2)}z`} />
          <text className="capsule-text" x={-w / 2 + 12} dy="0.35em">{model.family}</text>
          <text className="capsule-version" x={w / 2 - vw / 2 - 2} dy="0.35em" textAnchor="middle">{model.version}</text>
        </g>
      </g>
    );
  }

  const w = n.w - 8, h = n.h - 10;
  return (
    <g {...common}>
      <g className="lift">
        <rect className="card" x={-w / 2} y={-h / 2} width={w} height={h} rx={9} />
        <text className="card-text" textAnchor="middle" y={-((n.label.length - 1) * 16) / 2}>
          {n.label.map((l, i) => <tspan key={i} x={0} dy={i ? 16 : '0.35em'}>{l}</tspan>)}
        </text>
      </g>
    </g>
  );
}
