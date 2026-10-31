# Runbook Vercel dan Supabase

Belum ada cloud project yang dipilih, ditautkan, atau dideploy oleh setup ini. Runbook ini untuk langkah berikutnya. Aplikasi tanpa login memberi semua pengunjung akses perubahan ke dataset demo bersama; gunakan data sintetis dan jangan membuka upload sensitif.

## Supabase

Pilih project development dan production secara eksplisit. Gunakan project development untuk preview; jangan memberi preview branch akses ke data production. Pilih region Vercel dekat region Supabase setelah lokasi project diketahui.

Untuk lokal, install CLI dan jalankan Docker. Periksa `supabase --help` beserta help subcommand pada versi terpasang sebelum memakai perintah. Jalankan `npm run db:start`, `npm run db:reset`, `npm run db:types`, dan `npm run db:test`. Reset menghapus data lokal; jangan gunakan terhadap database remote.

Schema berasal dari migrations. Uji lokal sebelum penerapan remote pada project yang telah dipastikan. Jangan menerapkan migration dari `next build` atau setiap preview deploy. Review SQL, kompatibilitas, dan recovery sebelum perubahan production.

## Environment

`.env.example` adalah daftar nama env. Simpan `SUPABASE_SECRET_KEY` hanya di server dan pilih `STYLORA_WORKSPACE_ID` tetap. Secret key melewati RLS; semua query server wajib membatasi workspace. Jangan mengirim secret melalui response, log, atau `NEXT_PUBLIC_`.

Isi Development, Preview, dan Production terpisah. Jangan menganggap placeholder sebagai konfigurasi valid. Jangan mencetak nilai environment saat troubleshooting. Jangan commit `.env.local` atau direktori `.vercel`.

`DEMO_WRITES_ENABLED` default `false`. Tetap nonaktif selama schema, seed workspace, dan koneksi database belum diverifikasi. Aktifkan `true` secara sengaja untuk environment demo yang menerima perubahan bersama; ini bukan kontrol identitas. Clean checkout dirancang tetap dapat build tanpa database, dengan empty state untuk wardrobe yang belum terhubung.

## Vercel

Gunakan Git integration untuk preview setiap PR. Pilih repository ini, framework Next.js, root repository, install `npm ci`, build `npm run build`; tidak perlu output directory kustom.

Jika memakai CLI, periksa identitas dan project yang tersedia:

```powershell
vercel --version
vercel whoami
vercel teams ls
vercel projects ls
```

Tautkan hanya ke team/project yang benar lalu tarik environment Development:

```powershell
vercel link
vercel env pull .env.local
```

Cloud linking dan env yang benar diperlukan untuk live verification resource cloud. Foundation masih dapat direview melalui build/tests jika credentials belum tersedia. Jangan membuat resource berbayar atau mempublikasikan aplikasi sekadar untuk menguji folder boilerplate.

## Gate release

1. `npm run check` dan `npm run build` lulus dengan lockfile yang sama.
2. Migration/seed diterapkan pada target yang benar; tipe sesuai schema.
3. Tes database menolak akses langsung anon/authenticated, dan tes server membuktikan scope workspace tetap.
4. Preview smoke: wardrobe CRUD, save/reopen look, dua browser berbagi dataset, error state, keyboard/mobile.
5. Browser bundle/response/log tidak mengandung secret; provider AI disabled sampai batas biaya dan rate diberlakukan.
6. Promosikan deployment yang telah diuji; catat URL/commit dan periksa errors setelah release.

Rollback aplikasi tidak membatalkan migration database. Gunakan perubahan schema yang kompatibel dan migration koreksi. Jangan menghapus/rename field destruktif di jam terakhir demo.

Upload nanti tetap memakai bucket privat dan server-mediated API dengan batas MIME/ukuran, workspace path, serta cleanup. Tanpa auth, bucket privat tidak menciptakan privasi antar pengunjung yang memakai API aplikasi bersama.

Ketersediaan Docker, reset/RLS lokal, cloud connectivity, region/limits Vercel, dan provider nyata harus dicatat dari eksekusi aktual. Jangan menyebutnya terverifikasi hanya karena kode tersedia.

Referensi: [Vercel Git deployment](https://vercel.com/docs/deployments/git), [Supabase local development](https://supabase.com/docs/guides/local-development), [Supabase API keys](https://supabase.com/docs/guides/api/api-keys).
