import { useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, Maximize } from 'lucide-react';
import { DEMO } from './config';
import { sb } from './lib/supabase';
import { fromSeed, fromSupabase, withoutArchived } from './lib/data';
import { buildGraph, related } from './lib/graph';
import { buildIndex, search } from './lib/search';
import { useMedia } from './lib/hooks';
import type { Stack } from './lib/types';
import { TerrainMap, type MapHandle } from './components/TerrainMap';
import { DetailPanel } from './components/DetailPanel';
import { SearchBar } from './components/SearchBar';
import { Login } from './components/Login';
import { Logo } from './components/Logo';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!sb);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!authReady) return <div className="splash"><Logo size={48} /></div>;
  if (sb && !session) return <Login />;
  return <Loader />;
}

function Loader() {
  const [stack, setStack] = useState<Stack | null>(DEMO ? fromSeed() : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sb) return;
    fromSupabase(sb).then(setStack).catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <main className="login">
        <div className="login-card">
          <Logo size={48} />
          <h1>Data belum bisa dimuat</h1>
          <p className="muted">{error}</p>
          <p className="muted small">Cek apakah skema <code>toolstack</code> sudah ada di Exposed schemas (lihat README).</p>
          <a className="login-demo" href="?demo">Buka mode contoh</a>
        </div>
      </main>
    );
  }
  if (!stack) return <div className="splash"><Logo size={48} /></div>;
  return <Terrain raw={stack} />;
}

function Terrain({ raw }: { raw: Stack }) {
  const isDesktop = useMedia('(min-width: 768px)');
  const stack = useMemo(() => withoutArchived(raw), [raw]);
  const graph = useMemo(() => buildGraph(stack), [stack]);
  const fuse = useMemo(() => buildIndex(stack), [stack]);
  const map = useRef<MapHandle>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const hits = useMemo(() => search(fuse, query), [fuse, query]);

  const lit = useMemo(() => {
    if (hits.length) {
      const nodes = new Set<string>(), edges = new Set<string>();
      for (const h of hits) {
        const r = related(graph, h.id);
        r.nodes.forEach(x => nodes.add(x));
        r.edges.forEach(x => edges.add(x));
      }
      return { nodes, edges, strong: true };
    }
    if (query.trim().length >= 2) return { nodes: new Set<string>(), edges: new Set<string>(), strong: true };
    if (selected) return { ...related(graph, selected), strong: false };
    return null;
  }, [hits, query, selected, graph]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target as HTMLElement)?.closest('input')) setSelected(null);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const panelOpen = !!selected;
  const padRight = isDesktop && panelOpen ? 444 : 0;
  const padBottom = !isDesktop && panelOpen ? Math.round(innerHeight * 0.35) : 0;

  function pick(id: string) {
    setQuery('');
    setSelected(id);
    map.current?.focusNode(id);
  }

  return (
    <div className="app">
      <TerrainMap ref={map} graph={graph} stack={stack} selected={selected}
        lit={lit} litStrong={!!lit?.strong} padRight={padRight} padBottom={padBottom}
        onSelect={setSelected} />

      <header className="topbar" style={{ right: padRight }}>
        <div className="brand"><Logo /><span>Terrain</span></div>
        <SearchBar query={query} hits={hits} onQuery={setQuery} onPick={pick} />
        <div className="top-actions">
          {DEMO
            ? <a className="chip" href="./" aria-label="Keluar dari mode contoh"><span className="demo-long">Mode contoh · Keluar</span><span className="demo-short">Contoh ✕</span></a>
            : <button type="button" className="chip icon-chip" aria-label="Keluar" title="Keluar" onClick={() => sb?.auth.signOut()}><LogOut size={15} /></button>}
        </div>
      </header>

      <div className="corner" style={{ right: padRight + 16, bottom: padBottom + 16 }}>
        <button type="button" className="round-btn" aria-label="Tampilkan seluruh peta" title="Seluruh peta"
          onClick={() => { setSelected(null); map.current?.fitAll(); }}>
          <Maximize size={17} />
        </button>
      </div>

      {isDesktop && (
        <aside className="legend" aria-label="Keterangan">
          <span><i className="lg-tool" />Tool</span>
          <span><i className="lg-hub" />Hub lintas wilayah</span>
          <span><i className="lg-dicoba" />Dicoba</span>
          <span><i className="lg-model" />Model</span>
          <span><i className="lg-need" />Kebutuhan</span>
        </aside>
      )}

      <DetailPanel id={selected} graph={graph} stack={stack} isDesktop={isDesktop} onSelect={setSelected} />
    </div>
  );
}
