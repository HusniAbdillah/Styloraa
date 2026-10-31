# Instruksi kerja Stylora

## Scope

Baca `PRD.md`, `docs/architecture.md`, dan `docs/sprint-plan.md`. Target adalah demo 7 jam dengan 4 developer. Aplikasi tidak menggunakan auth: satu workspace demo dipakai bersama, semua pengunjung dapat mengubah data. Jangan menambahkan login, user ownership, atau janji data privat tanpa perubahan scope yang eksplisit.

## Implementasi

- TypeScript strict, Server Components sebagai default, `use client` hanya untuk interaksi browser.
- Jaga route di `src/app` tipis. Kode bisnis berada di `features/<fitur>`; buat subfolder schema/components/actions/queries hanya saat dibutuhkan.
- Semua akses Supabase berada pada modul server-only. Jangan membuat browser Supabase client atau mengirim secret key ke browser.
- `SUPABASE_SECRET_KEY` memiliki hak tinggi dan melewati RLS. Setiap query/mutasi harus dibatasi `STYLORA_WORKSPACE_ID` dari environment server, termasuk relasi anak. Jangan menerima workspace ID dari form/client.
- Aktifkan RLS pada tabel publik dan jangan beri akses data langsung kepada `anon`/`authenticated`. RLS tidak melindungi bug query server yang memakai secret key; audit predicate workspace secara terpisah.
- Validasi input di server memakai Zod. Jangan menganggap data dari Server Action atau Route Handler otomatis aman.
- Jangan menambahkan upload sensitif pada demo tanpa identitas. Bucket tetap privat; upload/download nanti melalui server dengan scope workspace, MIME/size limit, dan nama acak. Jangan simpan signed URL sebagai identitas file permanen.
- Jangan mencatat secrets, payload pribadi, atau signed URL. Jangan fetch URL arbitrer dari client/provider tanpa pembatasan sumber.
- Database migrations adalah source of truth. Buat migration lewat Supabase CLI; jangan mengedit migration yang telah digunakan tim. Koordinasikan perubahan dengan pemilik database.
- Generated database types tidak diedit manual. Perbaiki schema, regenerasi dengan `npm run db:types`, dan review diff. Jika generation terhalang, laporkan batas tersebut.
- AI yang belum dikonfigurasi harus memberi unavailable yang jelas. Jangan menampilkan mock sebagai hasil provider nyata.
- Vercel request bukan worker permanen. Jangan memakai timer atau promise tidak di-await untuk job panjang. Record `queued` saja tidak menjalankan job.
- Gunakan token palet proyek, label form, focus state, keyboard, loading/empty/error state. Tambahkan shadcn/ui hanya bila membantu kebutuhan nyata.
- Jangan menambah ORM, state manager, queue, atau SDK AI tanpa kebutuhan teruji. Jangan membuat lapisan kosong sekadar melengkapi struktur.

## Kerja paralel dan pemeriksaan

Patuhi pemilik file pada `docs/sprint-plan.md`. Satu pemilik untuk lockfile/root CSS/layout/env, satu untuk migrations/generated types. Sampaikan kontrak sebelum mengubah file tim lain. Agent hanya mengerjakan scope yang ditugaskan; jangan memperluas task atau menambah agent tanpa kebutuhan dan otorisasi.

Jalankan `npm run check` dan `npm run build`. Untuk database jalankan reset lokal, `npm run db:types`, dan `npm run db:test`. Uji scope workspace lain ditolak oleh layer server dan akses langsung anon/authenticated ditolak database. Catat hasil aktual dan checks yang belum berjalan. Jangan menyatakan route placeholder, build, atau unit test sebagai bukti fitur end-to-end.

Jangan commit/push/deploy atau mengubah database remote hanya karena pemeriksaan lokal selesai. Jangan mengubah memory atau menyalin skill/cache pribadi ke repo. Lihat `docs/skills.md` untuk pemilihan panduan agent.
