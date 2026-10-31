# Arsitektur

## Keputusan inti

Satu aplikasi Next.js dan Supabase project per environment cukup untuk sprint empat developer. App Router menangani UI server, Server Actions, dan Route Handlers. Supabase menyediakan PostgreSQL dan Storage privat. Tidak perlu ORM tambahan: supabase-js serta generated types memenuhi query awal.

Aplikasi tanpa auth memakai satu workspace demo bersama. Semua pengunjung mempunyai kemampuan aplikasi yang sama. Jangan memperlakukan workspace ID sebagai identitas atau rahasia. Ini mempercepat demo, tetapi tidak memberikan privasi per pengguna.

## Struktur dan aliran data

`src/app` mengomposisikan fitur dan menangani routing. `src/features/<fitur>` memiliki schema Zod, query, aksi, serta UI miliknya. `components/ui` untuk primitive bersama yang benar-benar dipakai. Jangan membuat banyak lapisan repository/service/hook kosong.

Server Components mengambil data awal. Client Components menangani form dan pilihan item. Server Action cocok untuk mutasi UI; Route Handler untuk kontrak HTTP/job provider. Keduanya memakai helper server yang sama agar validasi dan scope tidak berbeda.

Browser → Server Action/Route Handler → validasi Zod → query Supabase dengan workspace tetap dari environment → response minimum. Browser tidak memiliki Supabase client atau secret. Query pribadi tidak relevan pada scope ini, tetapi cache bersama tetap harus mempunyai invalidasi setelah mutasi agar data demo tidak stale.

## Batas database

Tabel awal: wardrobe items, preferences, looks beserta itemnya, capsules beserta itemnya, serta AI jobs. Semua aggregate dan row relasi dibatasi workspace. Foreign key/constraint mencegah relasi lintas workspace; predicate pada row anak saja tidak cukup.

RLS aktif dan akses langsung `anon`/`authenticated` ditolak. Server memakai `SUPABASE_SECRET_KEY` yang melewati RLS, sehingga setiap query harus menyertakan `STYLORA_WORKSPACE_ID` dari environment. Jangan mempercayai workspace dari form/URL/body. Tes database dan tes scope server memeriksa batas yang berbeda.

Simpan look/capsule beserta relasinya secara atomik bila membutuhkan beberapa writes. Rangkaian HTTP insert terpisah bukan transaksi; gunakan fungsi SQL yang ditinjau atau mekanisme transaksi nyata, dengan scope tetap. Hindari `SECURITY DEFINER` tanpa kebutuhan dan review khusus.

Generated types mengikuti migrations. Generation yang terhalang Docker/lingkungan harus dilaporkan, bukan ditutup dengan klaim tipe telah dihasilkan.

## File dan AI

Bucket tetap privat. Upload sensitif belum masuk scope. Upload demo nanti melalui server, dengan size/MIME limit, path acak dalam workspace tetap, serta cleanup file yatim. Database menyimpan storage path; signed URL dibuat saat diperlukan dan tidak disimpan permanen. Jangan membuat endpoint fetch URL arbitrer karena membuka SSRF.

AI hanya di server dengan secret environment. Validasi output, batas biaya/rate, timeout, dan error yang jelas diperlukan sebelum provider diaktifkan pada demo publik tanpa login. Provider belum terpasang: unavailable adalah perilaku yang benar.

Job panjang membutuhkan executor nyata. Record PostgreSQL menyimpan status; record tersebut bukan queue yang otomatis diproses. Utamakan async API provider dengan polling bila cocok. Tambahkan queue/worker setelah durasi dan reliability diuji; jangan menjalankan background promise sesudah response Vercel.

Sharing ditunda sampai kontrak snapshot publik, token acak, expiry, revoke, dan field aman disepakati. Jangan memberi anon select pada data internal hanya demi halaman shared.

## Tradeoff sprint

- Tanpa auth mengurangi setup dan alur demo; konsekuensinya semua pengunjung dapat mengubah dataset bersama.
- Server-only Supabase menjaga secret di server; konsekuensinya validasi scope harus benar di setiap endpoint karena RLS tidak membatasi secret client.
- Satu pemilik migrations/lockfile mengurangi konflik integrasi. Fitur tidak boleh membuat tabel alternatif untuk menghindari koordinasi.
- Server-first mengurangi state sinkronisasi; komponen client tetap dipakai untuk interaksi yang memerlukannya.
- Tes berfokus pada validasi, workspace scope, constraint, dan kegagalan penting; snapshot setiap placeholder tidak membantu target sprint.

Referensi resmi: [Next.js App Router](https://nextjs.org/docs/app), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase API keys](https://supabase.com/docs/guides/api/api-keys), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
