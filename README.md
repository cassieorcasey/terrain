# Terrain

Peta interaktif untuk "My AI Tool Stack": empat wilayah (Study Tools, Home Base Tools, Octopus HQ, Builder Dungeon), tool sebagai gelembung, dan pencarian berdasarkan tugas.

Situs: https://cassieorcasey.github.io/terrain/ · Mode contoh tanpa login: https://cassieorcasey.github.io/terrain/?demo

- Spesifikasi: [docs/konsep.md](docs/konsep.md)
- Data awal: [data/seed.json](data/seed.json), diimpor dari Notion pada 8 November 2026
- Database: skema `toolstack` di project Supabase StudyIng

## Setup sekali

1. **Supabase → SQL Editor**: jalankan `sql/schema.sql`, lalu `sql/seed.sql`.
2. **Supabase → Integrations → Data API → Settings**: tambahkan `toolstack` ke Exposed schemas dan keenam tabelnya ke Exposed tables.
3. **Supabase → Authentication → URL Configuration → Redirect URLs**: tambahkan `https://cassieorcasey.github.io/terrain/`.
4. **GitHub → repo → Settings → Pages → Source**: pilih **GitHub Actions**.

Setiap push ke `main` otomatis di-build dan di-deploy oleh `.github/workflows/deploy.yml`.

Login memakai akun yang sama dengan StudyIng (magic link). Synthesis, Waypoint, dan Terrain ada di domain yang sama, jadi kalau sudah masuk di salah satunya, yang lain ikut masuk.

## Mode contoh

Tambahkan `?demo` di URL untuk membuka peta dari `data/seed.json` tanpa login dan tanpa Supabase.

## Seed data

`sql/seed.sql` dihasilkan dari `data/seed.json`:

```
python3 scripts/build_seed.py data/seed.json sql/seed.sql
```

Script ini juga menghitung susunan 2x2 keempat wilayah. Jalankan ulang hanya bila susunan wilayah memang ingin dihitung ulang. Mode contoh memakai susunan yang sama (`DEMO_GRID` di `src/lib/data.ts`).

## Cara peta disusun

Semua dihitung di browser setiap kali data dimuat, dan hasilnya selalu sama untuk data yang sama (tanpa angka acak sungguhan).

- **Pulau**: ukurannya mengikuti luas anggota satu-wilayah, bentuknya dari tiga harmonik yang diturunkan dari id kategori. Keempat pulau dirapatkan sampai jarak antarpantai sama dengan lebar selat, tanpa keluar dari kuadran 2x2-nya.
- **Tool satu-wilayah** dijaga di dalam pulaunya. Di Builder Dungeon dan Octopus HQ, tool sekelompok (`group_name`) dikumpulkan dan diberi label kelompok.
- **Tool hub** ditarik ke rata-rata pusat wilayahnya dan didorong keluar dari daratan, jadi mengapung di selat. Garis putus-putus tipis menghubungkannya ke tiap pulau.
- **Study Tools** disusun tiga kolom: kebutuhan → model → tool, mengalir ke arah tool penyedia di selat. Urutan vertikalnya memakai barycenter supaya garis jarang bersilangan.

## Struktur

| Bagian | Isi |
|---|---|
| `src/lib/data.ts` | Muat enam tabel `toolstack` atau `seed.json`, sembunyikan yang berstatus arsip |
| `src/lib/graph.ts` | Node, garis, pulau, dan fisika d3-force |
| `src/lib/search.ts` | Indeks Fuse.js; cocok persis dulu, fuzzy bila tidak ada hasil |
| `src/components/TerrainMap.tsx` | Canvas SVG dengan zoom, pulau, garis, dan tiga jenis node |
| `src/components/DetailPanel.tsx` | Panel kaca di laptop, bottom sheet Vaul (35% / 85%) di iPhone |
| `src/components/SearchBar.tsx` | Command palette (⌘K atau `/`) |

Dibangun dengan React, Vite, d3-force, d3-zoom, Fuse.js, Vaul, dan supabase-js.

## Status

v1a (baca saja) selesai: canvas wilayah, panel samping, pencarian berdasarkan tugas, login. Berikutnya v1b: form tambah, edit, dan arsip.
