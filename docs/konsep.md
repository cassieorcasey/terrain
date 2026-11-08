# Terrain: Peta "My AI Tool Stack"

Konsep app · Disusun 8 November 2026 · Referensi desain: `referensi_desain_ui_ux_terrain.md`

## Inti konsep

Terrain mengubah halaman Notion "My AI Tool Stack" menjadi **peta wilayah interaktif**. Keempat kategori (Study Tools, Home Base Tools, Octopus HQ, Builder Dungeon) adalah wilayah dengan posisi tetap di canvas. Setiap tool hanya muncul **sekali**, dan posisinya ditentukan oleh di mana saja ia dipakai: tool yang hanya ada di satu kategori tinggal di pinggir wilayahnya, sedangkan tool lintas kategori seperti Claude Cowork ditarik ke perbatasan beberapa wilayah sekaligus. Hasilnya, sekali lihat terlihat mana tulang punggung stack dan mana tool pinggiran.

## Dua cara memakainya

**Mode utama: menjelajah peta.** Lihat keempat wilayah, zoom ke salah satunya, lalu ketuk gelembung tool. Panel samping terbuka dan menampilkan info umum tool itu, diikuti perannya di setiap kategori beserta contoh alur kerjanya. Untuk Claude Cowork, panel berisi tiga bagian: perannya di Octopus HQ, Home Base Tools, dan Builder Dungeon.

**Mode sekunder: mencari berdasarkan tugas.** Ketik "slack" atau "konteks panjang" di kotak pencarian. Node yang cocok menyala, sisanya meredup, dan jalur kebutuhan → model → tool tergambar. Daftar hasil menampilkan contoh alur kerja yang cocok, jadi terlihat bukan hanya tool-nya tapi juga konteks pemakaiannya. Node kebutuhan juga bisa diketuk langsung di canvas.

## Tiga jenis node

| Jenis | Asal | Contoh |
|---|---|---|
| **Tool** | Ketiga kategori dan Study Tools | Claude Cowork, Cursor, n8n, Perplexity |
| **Model** | Study Tools | Gemini 4 Argon → terhubung ke tool Gemini |
| **Kebutuhan** | Study Tools | "Butuh jendela konteks besar" → Gemini 4 Argon, Claude Sonnet/Opus 5.5, GPT-6.1 Sol |

- Kebutuhan bisa menunjuk ke model (Gemini 4 Argon untuk video) atau langsung ke tool (Perplexity untuk menggabungkan hasil banyak model). Ollama ditambahkan sebagai tool penyedia Qwen3.5.
- Relasi kebutuhan → model/tool punya label peran: *utama*, *alternatif*, atau *untuk tugas kompleks*.
- Model disimpan sebagai **keluarga + versi** (keluarga "Claude Sonnet", versi "5.5"), sehingga saat versi baru rilis cukup mengubah satu kolom tanpa memutus relasinya.

## Model data

Semua tabel ada di skema `toolstack` dalam project Supabase StudyIng.

| Tabel | Isi |
|---|---|
| `categories` | Empat wilayah, masing-masing dengan warna dan ikon garis dari Notion |
| `tools` | Nama, URL, logo (favicon otomatis), catatan umum, status |
| `placements` | Penghubung tool ↔ kategori: deskripsi peran dan contoh alur kerja di kategori itu |
| `models` | Keluarga, versi, tool penyedia, status |
| `needs` | Kebutuhan dari Study Tools |
| `need_targets` | Relasi kebutuhan → model **atau** tool (`model_id` atau `tool_id`, tepat satu terisi), dengan label peran |

`placements` adalah jantung keputusan "satu tool, banyak peran".

### Status

Tool dan model punya status **Aktif**, **Dicoba**, atau **Arsip**.

- Genspark dan Manus (sekarang "belum dikategorikan") masuk sebagai *Dicoba* dan tampil dengan garis putus-putus, seperti bangunan yang masih dibangun.
- Yang *Arsip* disembunyikan dari canvas secara default, tapi riwayatnya tetap tersimpan.

## Tampilan

- **Wilayah berwarna lembut** dengan ikon kategori dari Notion (papan tulis, rumah, gedung, pilar) sebagai penanda.
- **Tool sebagai gelembung logo**; model dan kebutuhan dengan bentuk berbeda supaya ketiga jenis node mudah dibedakan.
- **Fisika d3-force** dengan gaya tarik kustom: tiap tool ditarik ke pusat wilayahnya, dan tool hub ditarik ke rata-rata pusat semua wilayah yang dipakainya.
- **Susunan wilayah 2×2 dihitung sekali dari seed data lalu dikunci.** Pasangan diagonal membentuk perfect matching pada K₄ (tiga kemungkinan); dipilih matching dengan jumlah tool bersama terkecil supaya hub dua wilayah tidak jatuh ke tengah canvas. Hasil dari data Notion: Study Tools kiri atas, Home Base Tools kanan atas, Octopus HQ kiri bawah, Builder Dungeon kanan bawah. Dua matching seri di bobot 2 (yang ketiga 5); seri dipecah dengan urutan baca halaman Notion. Dihitung ulang hanya bila dipicu manual (`scripts/build_seed.py`).
- **Pulau berbentuk tetap.** Tiap wilayah adalah kurva tertutup halus yang dibuat sekali saat seed (ukuran sesuai jumlah anggota) dan tidak bergerak. Tool satu-wilayah dijaga di dalam pulaunya oleh gaya pembatas; tool hub mengapung di selat di antara pulau.
- **Mode terang dan gelap mengikuti sistem**, dengan token warna terpisah per mode. Di mode gelap pulau naik ke opasitas sekitar 16–22% dengan garis pantai tipis yang lebih terang, dan laut berwarna biru-arang (bukan hitam pekat). Kontras pulau terhadap laut dicek di kedua mode saat implementasi.
- **Garis hub dibuat tipis** sampai node-nya dipilih, supaya canvas tidak kusut.
- **Di iPhone**, layout sama dengan zoom: dari jauh tampak empat wilayah, ketuk satu untuk masuk.

### Referensi desain

Detail lengkap ada di `referensi_desain_ui_ux_terrain.md`. Ringkasnya:

| Komponen | Referensi | Inti |
|---|---|---|
| Latar wilayah | Map of GitHub (Andrei Kashcha), Apple Maps | Pulau organik berwarna pastel (opasitas 8–12%), ikon Notion besar sebagai watermark |
| Tool aktif | Apple Watch Honeycomb | Lingkaran solid dengan favicon, bayangan tipis, membesar 1.1x saat disentuh; hub sedikit lebih besar atau bercincin |
| Tool dicoba | React Flow draft node | Tepi putus-putus (`stroke-dasharray: 4 3`), opasitas 75% ala blueprint |
| Model | Apple Settings tags | Kapsul dengan badge versi terpisah (`Claude Sonnet` \| `5.5`) |
| Kebutuhan | Linear task card | Persegi membulat, warna netral |
| Garis hubung | Obsidian Graph View | Kurva Bezier 1px, opasitas 15%; menyala 2px saat node terkait aktif |
| Pencarian | Apple Maps Transit | Command palette melayang di atas tengah; node tak cocok turun ke opasitas 0.15 |
| Posisi pusat vs pinggir | Thoughtworks Tech Radar | Tool spesifik di pinggir wilayah, tool multifungsi di pertemuan wilayah |
| Panel detail | Apple Find My, iCloud | Desktop: panel kaca 380–420px di kanan. iPhone: Vaul sheet dengan snap 35% dan 85% |
| Peran multi-kategori | iCloud / macOS Settings | Kartu bertumpuk berlabel warna wilayah |

## Data dan infrastruktur

| Aspek | Keputusan |
|---|---|
| Sumber awal | Impor sekali dari keempat halaman Notion menjadi seed data; Notion lalu menjadi arsip baca-saja |
| Pengeditan | Form di dalam app (mulai v1b) |
| Database | Supabase project StudyIng, skema `toolstack` (paket gratis hanya 2 project aktif, keduanya sudah terpakai) |
| Stack | React + Vite, supabase-js, Motion, Vaul, d3-force, Fuse.js |
| Pencarian | Di sisi klien (Fuse.js), tanpa query ke backend |
| Deploy | GitHub Pages lewat GitHub Actions, pipeline disalin dari Waypoint |
| Akses | Login magic-link bersama StudyIng, Synthesis, dan Waypoint; RLS aktif |

## Rilis

**v1a (baca saja)**
- Impor data dari Notion
- Canvas wilayah dengan fisika klaster
- Panel samping
- Pencarian berdasarkan tugas
- Login

Tujuan: menguji layout klaster dengan data asli sebelum membangun form.

**v1b**
- Form tambah, edit, dan arsip untuk tool, penempatan, model, dan kebutuhan

**Jadwal:** tanpa tenggat, dikerjakan saat ada waktu luang.

## Di luar v1

- Tanya dalam bahasa bebas ke AI ("aku mau bikin dashboard tim, pakai apa?")
- Tautan ke materi di Synthesis atau topik di Waypoint (misalnya Claude Code → materi "Agentic coding")
- Field biaya langganan, paket, dan frekuensi pemakaian

## Seed data (8 November 2026)

- 4 wilayah, 29 tool (27 dari Notion + ChatGPT dan Ollama sebagai penyedia model), 36 penempatan, 8 model, 8 kebutuhan, 16 relasi kebutuhan → model/tool.
- Tool hub: Claude Cowork dan Gemini (3 wilayah); Claude Chat, Perplexity, dan Genspark (2 wilayah).
- Tool yang menyediakan model atau ditunjuk kebutuhan mendapat penempatan turunan di Study Tools (grup "Penyedia model").
- Subkategori Builder Dungeon dan "Sebutan Khusus" disimpan di kolom `group_name` penempatan.

## Yang masih terbuka

1. **Subkategori Builder Dungeon** (Build Apps from Ideas, Develop Codebases, Manage Agents, Internal Tools, General-Purpose Agents, Supporting Infrastructure): sub-wilayah di dalam wilayahnya, atau cukup label pengelompokan. Diputuskan setelah melihat v1a dengan data asli.

## Ringkasan keputusan

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Pekerjaan utama app | Peta referensi sebagai mode utama, pencarian berdasarkan tugas sebagai mode sekunder |
| 2 | Tool di banyak kategori | Satu node per tool; peran per kategori di tabel `placements` |
| 3 | Study Tools | Kebutuhan, model, dan tool sebagai tiga jenis node; model = keluarga + versi |
| 4 | Sumber dan pengeditan data | Impor sekali dari Notion, lalu edit lewat form di app |
| 5 | Supabase project | Project StudyIng, skema `toolstack` |
| 6 | Tata letak canvas | Empat klaster dengan wilayah tetap; tool hub di antaranya |
| 7 | Mode cari berdasarkan tugas | Kotak pencarian sisi klien dengan sorotan jalur di canvas |
| 8 | Field tool dan model | Nama, URL, logo favicon, catatan, status Aktif/Dicoba/Arsip |
| 9 | Identitas visual | Peta dengan wilayah berwarna, ikon Notion, tool sebagai gelembung logo |
| 10 | Stack teknis | React + Vite seperti Waypoint, plus d3-force dan Fuse.js, deploy ke GitHub Pages |
| 11 | Cakupan rilis | v1a baca-saja dengan login; v1b form edit |
| 12 | Nama | Terrain |
| 13 | Kebutuhan yang menunjuk ke tool | Tabel `need_targets`: kebutuhan → model atau tool; Ollama jadi tool baru |
| 14 | Susunan wilayah 2×2 | Matching diagonal dengan bobot tool bersama terkecil, dihitung sekali dari seed lalu dikunci |
| 15 | Bentuk pulau | Tetap sejak seed; hub mengapung di selat |
| 16 | Mode gelap | Ikuti sistem, token warna per mode, opasitas pulau lebih tinggi di mode gelap |
| 17 | Jadwal | Tanpa tenggat |
