import { Building, Columns3, House, Presentation, Square, type LucideIcon } from 'lucide-react';

/** Ikon garis kategori, sesuai ikon halaman Notion. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  presentation: Presentation,
  home: House,
  building: Building,
  columns: Columns3,
};

export function categoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Square;
}

export function hostOf(url: string | null) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

export function faviconUrl(url: string | null) {
  const host = hostOf(url);
  return host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : null;
}

export function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
