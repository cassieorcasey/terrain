-- Dihasilkan oleh scripts/build_seed.py dari data/seed.json. Jangan diedit manual.
-- Aman dijalankan ulang: isi lama dikosongkan dulu. JANGAN jalankan lagi setelah
-- data mulai diedit lewat form (v1b), karena perubahan dari app akan terhapus.
begin;

truncate toolstack.need_targets, toolstack.needs, toolstack.models,
         toolstack.placements, toolstack.tools, toolstack.categories restart identity;

insert into toolstack.categories (id, name, icon, description, grid_row, grid_col) values ('study', 'Study Tools', 'presentation', null, 0, 0);
insert into toolstack.categories (id, name, icon, description, grid_row, grid_col) values ('home', 'Home Base Tools', 'home', null, 0, 1);
insert into toolstack.categories (id, name, icon, description, grid_row, grid_col) values ('octopus', 'Octopus HQ', 'building', null, 1, 0);
insert into toolstack.categories (id, name, icon, description, grid_row, grid_col) values ('builder', 'Builder Dungeon', 'columns', 'Pilih tools berdasarkan pekerjaan yang ingin diselesaikan, bukan yang terlihat paling canggih. Tools di sini saling tumpang tindih, bukan satu tangga kemampuan.', 1, 1);

insert into toolstack.tools (id, name, url, note, status) values ('claude-cowork', 'Claude Cowork', 'https://claude.ai', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('claude-chat', 'Claude Chat', 'https://claude.ai', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('perplexity', 'Perplexity', 'https://www.perplexity.ai', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('notebooklm', 'NotebookLM', 'https://notebooklm.google.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('gemini', 'Gemini', 'https://gemini.google.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('nano-banana', 'Nano Banana', null, null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('notion', 'Notion', 'https://www.notion.so', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('wisprflow', 'Wisprflow', 'https://wisprflow.ai', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('genspark', 'Genspark', 'https://www.genspark.ai', null, 'dicoba');
insert into toolstack.tools (id, name, url, note, status) values ('viktorai', 'ViktorAI', null, null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('bolt', 'Bolt', 'https://bolt.new', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('lovable', 'Lovable', 'https://lovable.dev', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('replit', 'Replit', 'https://replit.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('v0', 'v0', 'https://v0.app', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('claude-code', 'Claude Code', 'https://www.claude.com/product/claude-code', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('cursor', 'Cursor', 'https://cursor.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('codex', 'Codex', 'https://openai.com/codex', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('warp', 'Warp', 'https://www.warp.dev', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('retool', 'Retool', 'https://retool.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('n8n', 'n8n', 'https://n8n.io', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('openai-agents-sdk', 'OpenAI Agents SDK', 'https://openai.github.io/openai-agents-python/', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('hermes', 'Hermes', null, null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('manus', 'Manus', 'https://manus.im', null, 'dicoba');
insert into toolstack.tools (id, name, url, note, status) values ('supabase', 'Supabase / PostgreSQL', 'https://supabase.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('hostinger-vps', 'Hostinger / VPS', 'https://www.hostinger.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('serpapi', 'SerpAPI', 'https://serpapi.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('mcp-servers', 'MCP Servers', 'https://modelcontextprotocol.io', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('chatgpt', 'ChatGPT', 'https://chatgpt.com', null, 'aktif');
insert into toolstack.tools (id, name, url, note, status) values ('ollama', 'Ollama', 'https://ollama.com', null, 'aktif');

insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-cowork', 'home', null, null, 'Pusat AI-mu yang terhubung ke kalender, email, Slack, dan investasi untuk alur kerja personal yang mendalam', array['Ringkasan pagi: pergerakan portofolio, kotak masuk, dan rencana hari', 'Riset investasi, pelacakan laporan keuangan dan katalis', 'Pencatatan makanan dan olahraga, pelacakan energi harian', 'Manajemen tim dan tugas: prioritas dan pembaruan', 'Pipeline YouTube: dari riset ke naskah hingga aset', 'Persiapan rapat: tarik konteks dari kalender dan email', 'Keputusan strategis: kerangka kerja dan trade-off']::text[], 0);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-chat', 'home', null, null, 'Pertanyaan terarah dan sesi brainstorming saat kamu ingin mitra berpikir yang tajam', array['Bantu aku men-troubleshoot home lab Mac Studio-ku, ethernet tidak melakukan routing antara NAS dan mesin utama', 'Susun rencana perjalanan 10 hari ke Tokyo: fokus jajanan kaki lima, tanpa jebakan turis, perjalanan sehari ke Kyoto', 'Apa cara terbaik mengatur waktuku berdasarkan yang kamu tahu tentang pekerjaan dan keseharianku?', 'Bantu aku menyusun percakapan sulit dengan anggota tim soal kinerja yang kurang', 'Monitorku terus tidur saat Zoom padahal pengaturan layar sudah diubah, pandu aku memperbaikinya']::text[], 1);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('perplexity', 'home', null, null, 'Pencarian web real-time dengan sitasi untuk pertanyaan objektif saat kamu ingin sumber, bukan opini AI', array['Sepatu terbaik untuk kaki datar? dari berbagai situs ulasan', 'Bandingkan platform VPS untuk aplikasi web kecil', 'Proyek hardware pemula terbaik dari Reddit', 'Persyaratan visa ke Jepang (warga HK)', 'Sebenarnya apa pendapat orang tentang X vs Y?', 'Riset terbaru tentang puasa intermiten', 'Standing desk terbaik di bawah $500 saat ini']::text[], 2);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('notebooklm', 'home', 'Sebutan Khusus', null, 'Riset dan pembelajaran berbasis dokumenmu sendiri', '{}', 3);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('gemini', 'home', 'Sebutan Khusus', null, 'Konteks panjang dan tugas ekosistem Google', '{}', 4);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('nano-banana', 'home', 'Sebutan Khusus', null, 'Memvisualisasikan ide dan konsep', '{}', 5);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-cowork', 'octopus', 'Alat komunikasi & manajemen', null, 'Asisten AI yang terhubung ke Notion & Slack untuk menyusun pesan dan email', array['Menyusun pesan & balasan Slack', 'Menulis email dengan konteks lengkap', 'Merangkum utas & item tindakan']::text[], 6);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('notion', 'octopus', 'Alat komunikasi & manajemen', null, 'Basis pengetahuan tim, catatan rapat, kata sandi, panduan & dokumentasi', array['Database catatan rapat', 'Brankas kata sandi & SOP', 'Panduan internal & dokumentasi']::text[], 7);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('gemini', 'octopus', 'Alat komunikasi & manajemen', 'Google Ecosystem + Gemini', 'Suite menulis & kolaborasi dengan AI bawaan untuk dokumen dan berbagi', array['Menyusun & membagikan dokumen tim', 'Gemini untuk penulisan berbantuan AI', 'Penyuntingan bersama tim secara real-time']::text[], 8);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('wisprflow', 'octopus', 'Alat komunikasi & manajemen', null, 'Dikte suara-ke-teks yang bekerja di aplikasi apa pun di perangkatmu', array['Mendikte email & pesan Slack', 'Menulis dokumen dengan suara', 'Mencatat tanpa tangan']::text[], 9);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('genspark', 'octopus', 'Sebutan Khusus', null, 'Integrasi dan template yang mudah', '{}', 10);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('viktorai', 'octopus', 'Sebutan Khusus', null, 'Alat & alur kerja mitra AI', '{}', 11);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('bolt', 'builder', 'Build Apps from Ideas', null, 'Aplikasi lewat prompt di browser, bisa edit kode', '{}', 12);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('lovable', 'builder', 'Build Apps from Ideas', null, 'Aplikasi full-stack lewat percakapan dan edit visual', '{}', 13);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('replit', 'builder', 'Build Apps from Ideas', null, 'Bangun sampai terbit, lengkap dengan database, auth, dan hosting', '{}', 14);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('v0', 'builder', 'Build Apps from Ideas', null, 'UI dan aplikasi full-stack, deploy ke Vercel', '{}', 15);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-code', 'builder', 'Develop Codebases', null, 'Coding agent lintas codebase, tersedia di terminal, IDE, desktop, dan browser', '{}', 16);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('cursor', 'builder', 'Develop Codebases', null, 'Lingkungan pengembangan dengan agen yang mengubah file dan menjalankan perintah', '{}', 17);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('codex', 'builder', 'Develop Codebases', null, 'Coding agent untuk penulisan, review, dan debugging, lokal maupun cloud', '{}', 18);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('warp', 'builder', 'Manage Agents', null, 'Terminal dengan agen bawaan, juga tempat menjalankan agen lain seperti Claude Code, Codex, dan Cursor CLI', '{}', 19);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('retool', 'builder', 'Internal Tools, Automation & Custom Agents', null, 'Dashboard dan panel admin untuk tim', '{}', 20);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('n8n', 'builder', 'Internal Tools, Automation & Custom Agents', null, 'Otomasi alur antaraplikasi secara visual', '{}', 21);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('openai-agents-sdk', 'builder', 'Internal Tools, Automation & Custom Agents', null, 'Membangun logika agen sendiri lewat kode', '{}', 22);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-cowork', 'builder', 'General-Purpose Agents & Local Options', null, 'Agen untuk pekerjaan pengetahuan di luar coding, berjalan di cloud', '{}', 23);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('hermes', 'builder', 'General-Purpose Agents & Local Options', null, 'Agen yang bisa memakai model lokal atau API', '{}', 24);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('genspark', 'builder', 'General-Purpose Agents & Local Options', null, 'Belum dikategorikan', '{}', 25);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('manus', 'builder', 'General-Purpose Agents & Local Options', null, 'Agen AI cloud, belum dikategorikan', '{}', 26);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('supabase', 'builder', 'Supporting Infrastructure', null, 'Database', '{}', 27);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('hostinger-vps', 'builder', 'Supporting Infrastructure', null, 'Hosting', '{}', 28);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('serpapi', 'builder', 'Supporting Infrastructure', null, 'Hasil mesin pencari', '{}', 29);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('mcp-servers', 'builder', 'Supporting Infrastructure', null, 'Konektor agen ke tools (GitHub, Linear, Chrome, dll.)', '{}', 30);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('claude-chat', 'study', 'Penyedia model', null, 'Penyedia Claude Sonnet, Opus, dan Haiku 5.5', '{}', 31);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('gemini', 'study', 'Penyedia model', null, 'Penyedia Gemini 4 Argon', '{}', 32);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('chatgpt', 'study', 'Penyedia model', null, 'Penyedia GPT-6.1 Terra, GPT-6.1 Sol, dan GPT-6 Luna', '{}', 33);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('ollama', 'study', 'Penyedia model', null, 'Menjalankan Qwen3.5 secara lokal', '{}', 34);
insert into toolstack.placements (tool_id, category_id, group_name, display_name, description, workflows, sort_order) values ('perplexity', 'study', 'Penyedia model', null, 'Menggabungkan hasil dari banyak model', '{}', 35);

insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('qwen', 'Qwen', '3.5', 'ollama', 'aktif', 0);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('gemini-argon', 'Gemini Argon', '4', 'gemini', 'aktif', 1);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('gpt-terra', 'GPT Terra', '6.1', 'chatgpt', 'aktif', 2);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('gpt-sol', 'GPT Sol', '6.1', 'chatgpt', 'aktif', 3);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('gpt-luna', 'GPT Luna', '6', 'chatgpt', 'aktif', 4);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('claude-sonnet', 'Claude Sonnet', '5.5', 'claude-chat', 'aktif', 5);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('claude-opus', 'Claude Opus', '5.5', 'claude-chat', 'aktif', 6);
insert into toolstack.models (id, family, version, provider_tool_id, status, sort_order) values ('claude-haiku', 'Claude Haiku', '5.5', 'claude-chat', 'aktif', 7);

insert into toolstack.needs (id, name, sort_order) values ('privat', 'Perlu bersifat privat', 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('privat', 'qwen', null, 'utama', 'Lokal melalui Ollama', 0);
insert into toolstack.needs (id, name, sort_order) values ('visual', 'Melibatkan visual', 1);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('visual', 'gemini-argon', null, 'utama', null, 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('visual', 'gpt-terra', null, 'utama', null, 1);
insert into toolstack.needs (id, name, sort_order) values ('video', 'Terutama video', 2);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('video', 'gemini-argon', null, 'utama', null, 0);
insert into toolstack.needs (id, name, sort_order) values ('konteks-besar', 'Butuh jendela konteks besar', 3);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('konteks-besar', 'gemini-argon', null, 'utama', null, 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('konteks-besar', 'claude-sonnet', null, 'utama', null, 1);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('konteks-besar', 'claude-opus', null, 'utama', null, 2);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('konteks-besar', 'gpt-sol', null, 'utama', null, 3);
insert into toolstack.needs (id, name, sort_order) values ('sederhana', 'Sederhana dan langsung', 4);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('sederhana', 'claude-sonnet', null, 'utama', null, 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('sederhana', 'claude-haiku', null, 'alternatif', 'Untuk tugas ringan', 1);
insert into toolstack.needs (id, name, sort_order) values ('hemat-biaya', 'Sensitif biaya, volume besar', 5);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('hemat-biaya', 'claude-haiku', null, 'utama', null, 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('hemat-biaya', 'gpt-luna', null, 'alternatif', null, 1);
insert into toolstack.needs (id, name, sort_order) values ('coding', 'Coding', 6);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('coding', 'claude-sonnet', null, 'utama', null, 0);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('coding', 'claude-opus', null, 'tugas_kompleks', null, 1);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('coding', 'gpt-sol', null, 'tugas_kompleks', null, 2);
insert into toolstack.needs (id, name, sort_order) values ('banyak-model', 'Menggabungkan hasil dari banyak model', 7);
insert into toolstack.need_targets (need_id, model_id, tool_id, role, note, sort_order) values ('banyak-model', null, 'perplexity', 'utama', null, 0);

commit;
