# Terrain

Peta interaktif untuk "My AI Tool Stack": empat wilayah (Study Tools, Home Base Tools, Octopus HQ, Builder Dungeon), tool sebagai gelembung, dan pencarian berdasarkan tugas.

- Spesifikasi: [docs/konsep.md](docs/konsep.md)
- Data awal: [data/seed.json](data/seed.json), diimpor dari Notion pada 8 November 2026
- Database: skema `toolstack` di project Supabase StudyIng

## Database

1. Jalankan `sql/schema.sql`, lalu `sql/seed.sql` di SQL Editor Supabase.
2. Tambahkan `toolstack` ke Exposed schemas dan keenam tabelnya ke Exposed tables (Integrations > Data API > Settings).

`sql/seed.sql` dihasilkan dari `data/seed.json`:

```
python3 scripts/build_seed.py data/seed.json sql/seed.sql
```

Script ini juga menghitung susunan 2x2 keempat wilayah. Jalankan ulang hanya bila susunan wilayah memang ingin dihitung ulang.

## Status

Database dan seed data siap. Canvas v1a belum dimulai.
