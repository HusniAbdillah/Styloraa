# PRD Stylora — demo 7 jam

Status: scope kerja awal. Aplikasi tanpa login, satu workspace demo bersama. Semua pengunjung dapat mengubah data yang sama; gunakan data sintetis. Data pribadi dan upload sensitif bukan bagian scope ini.

## Alur prioritas

Tambahkan item wardrobe → pilih item → susun look → simpan → buka kembali. Demo harus menunjukkan persistence setelah reload, bukan hanya state browser. Profile hanya halaman scaffold dan tidak berarti ada akun pengguna.

| Prioritas | Fitur | Kriteria selesai |
| --- | --- | --- |
| P0 | Foundation | Build, token visual, shell responsif, env server, error state |
| P0 | Wardrobe | Buat/baca/ubah/hapus metadata item dalam workspace tetap; validasi server; data bertahan setelah reload |
| P0 | Create/save look | Pilih item workspace sama, simpan look beserta relasi, buka detail/saved looks; referensi workspace lain ditolak |
| P0 | Batas data | Tidak ada direct access anon/authenticated; secret tetap server; scope workspace diterapkan di semua query |
| P1 | Preferences | Preferensi demo bersama tersimpan dan dapat dibaca kembali |
| P1 | Capsule | Kumpulan item workspace yang sama, form tervalidasi; React Hook Form untuk form panjang |
| P1 | AI matching | Provider server-side nyata, output tervalidasi, timeout/status/error jujur; hanya setelah P0 stabil |
| P2 | Storage upload | Upload server-mediated, bucket privat, batas MIME/size, cleanup; data demo saja |
| P2 | Sharing | Kontrak snapshot/token/expiry/revoke tersendiri; jangan membuka tabel privat |
| P2 | Preview/try-on | Provider nyata dan executor job durable; bukan janji demo awal |
| P2 | Products/inspiration/decisions | Modul batas pengembangan; integrasi katalog/rekomendasi menyusul |

## Batas produk

Tidak ada auth, ownership per orang, pembayaran, organisasi multi-tenant, scraping katalog, queue wajib, atau training model. Workspace ID server adalah batas dataset, bukan pengganti autentikasi. Data bersama dapat diubah pengunjung lain; UI harus menjelaskan perilaku tersebut.

AI belum terhubung pada boilerplate. Endpoint disabled/unavailable tidak boleh diberi label hasil AI. Menulis job `queued` tanpa executor tidak dihitung sebagai implementasi job.

## Definition of done demo

- Alur P0 berjalan pada preview memakai Supabase nyata dan data tetap ada setelah reload.
- Request client tidak bisa memilih workspace lain atau menghubungkan item lintas workspace.
- Direct Data API anon/authenticated tidak membuka data, secret tidak masuk bundle/log/repository.
- Lint, typecheck, focused tests, production build, dan tes database lulus; pemeriksaan terhalang dicatat.
- Ada loading, empty, error, focus state dan tampilan mobile yang dapat dipakai.
- Tim memiliki URL preview, langkah demo, batas fitur, dan cara reset data demo.
