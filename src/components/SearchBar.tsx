import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Hit } from '../lib/search';

interface Props {
  query: string;
  hits: Hit[];
  onQuery(q: string): void;
  onPick(id: string): void;
}

const KIND_LABEL = { tool: 'Tool', model: 'Model', need: 'Kebutuhan' } as const;

/** Command palette melayang di atas tengah. Hasilnya sekaligus menyorot jalur di peta. */
export function SearchBar({ query, hits, onQuery, onPick }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const show = open && query.trim().length >= 2;

  function pick(h: Hit) {
    onPick(h.id);
    setOpen(false);
    input.current?.blur();
  }

  return (
    <div className="search" role="search">
      <div className="search-box">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={query}
          placeholder={matchMedia('(min-width: 768px)').matches ? 'Cari tugas atau tool, mis. slack' : 'Cari tugas atau tool'}
          aria-label="Cari berdasarkan tugas"
          aria-expanded={show}
          aria-controls="search-results"
          aria-activedescendant={show && hits[active] ? `hit-${active}` : undefined}
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={e => { onQuery(e.target.value); setOpen(true); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); pick(hits[active]); }
            else if (e.key === 'Escape') { if (query) onQuery(''); else input.current?.blur(); }
          }}
        />
        {query && (
          <button type="button" className="search-clear" aria-label="Hapus pencarian" onClick={() => { onQuery(''); input.current?.focus(); }}>
            <X size={14} />
          </button>
        )}
      </div>

      {show && (
        <ul className="search-results" id="search-results" role="listbox">
          {hits.length === 0 && <li className="search-empty">Tidak ada yang cocok dengan "{query.trim()}".</li>}
          {hits.map((h, i) => (
            <li key={h.id} id={`hit-${i}`} role="option" aria-selected={i === active}>
              <button type="button" className={`hit${i === active ? ' active' : ''}`}
                onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(h)}>
                <span className="hit-top">
                  <span className="hit-name">{h.name}</span>
                  <span className={`hit-kind kind-${h.kind}`}>{KIND_LABEL[h.kind]}</span>
                </span>
                {h.snippets.map(s => <span key={s} className="hit-snippet">{s}</span>)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
