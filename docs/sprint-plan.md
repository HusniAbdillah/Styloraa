# Sprint 7 jam, 4 developer

Target: satu alur wardrobe → create → save → reopen yang stabil. Total 28 jam orang nominal sudah termasuk integrasi, review, dan setup. Aplikasi tanpa login dan menggunakan satu dataset demo bersama.

## Pemilik file

| Developer               | Tanggung jawab                                 | Area milik                                               | Kontrak awal                       |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------- | ---------------------------------- |
| 1 — integrator          | Foundation, env, server client, shell, release | `lib/`, root layout/CSS, package/lockfile, CI            | Scope workspace, error, token UI   |
| 2 — data/wardrobe       | Schema, RLS, storage, wardrobe                 | `supabase/`, generated types, wardrobe feature/route     | Nama field dan pola query scope    |
| 3 — looks               | Pilihan item, save, detail, saved looks        | outfits/matching, create/look/saved routes               | Payload save dan relasi item       |
| 4 — preferences/capsule | Form, empty/error state, QA                    | preferences/capsules dan modul pendukung yang disepakati | Validasi form dan kebutuhan schema |

Developer 2 satu-satunya pemilik migrations dan generated types. Developer 1 satu-satunya pemilik dependency/lockfile dan layout bersama. Developer 4 membantu QA P0 sebelum meneruskan capsule. Agent dapat membantu subtask dengan area edit eksplisit; developer tetap memeriksa hasil dan integrasi.

## Jadwal

| Waktu       | Target                                             | Integrasi                                             |
| ----------- | -------------------------------------------------- | ----------------------------------------------------- |
| 00:00–00:30 | Install, env demo, schema/payload disepakati       | Bekukan field P0 dan kontrak save                     |
| 00:30–01:00 | Shell, server scope, migration, form awal          | Integrasikan foundation pertama                       |
| 01:00–02:00 | Wardrobe CRUD, pilihan item, preferences sederhana | Satu item tersimpan setelah reload                    |
| 02:00–03:00 | Save look, detail, saved looks, tes constraint     | Demo pertama alur P0 penuh                            |
| 03:00–04:00 | Error/loading, responsif, perbaikan persistence    | Preview bersama dan scope test                        |
| 04:00–05:00 | Tutup gap P0; capsule minimum bila stabil          | Pilih P1 yang masih realistis                         |
| 05:00–06:00 | Integrasi akhir, focused tests, build, smoke       | Semua fitur masuk sebelum jam 6                       |
| 06:00–07:00 | Feature freeze, blocker fixes, demo/handoff        | Tidak menambah dependency/schema baru kecuali blocker |

Jika jam 3 belum bisa menyimpan dan membuka look, hentikan P1/P2. Jika jam 5 provider belum menghasilkan output tervalidasi, biarkan unavailable dan demo alur manual. Jam terakhir dipakai stabilisasi, bukan pemasangan queue atau penambahan auth.

## Kolaborasi

Integrasikan perubahan kecil secara rutin. Sebelum edit file milik orang lain, sampaikan kebutuhan kontraknya. Setiap PR menyebut perubahan perilaku, checks, dan batas yang tersisa. Jangan menunggu semua branch selesai untuk menguji integrasi.

Tugas agent harus memuat tujuan konkret, area edit, kontrak input/output, batas operasi remote, checks, dan handoff. Agent yang menemui mismatch schema berkoordinasi dengan pemilik database, bukan membuat tabel kedua.

## Smoke flow

1. Tambahkan item dengan payload valid, reload, pastikan tetap ada.
2. Uji payload kosong/tidak valid; server menolak dengan error yang dapat dipahami.
3. Pilih item, simpan look, buka detail dan saved looks setelah reload.
4. Coba ID/workspace asing pada request; server tidak boleh membaca/menulis di luar workspace tetap.
5. Uji relasi look/capsule dengan item workspace lain; constraint menolak.
6. Direct Data API memakai anon/authenticated tidak dapat membaca/menulis tabel internal.
7. Coba dua browser; keduanya melihat dataset bersama sesuai scope demo.
8. Uji AI unavailable, job tidak ditemukan, error jaringan, serta tampilan mobile/keyboard.

Catat hasil aktual dengan environment dan commit. Daftar ini bukan klaim checks telah dijalankan.
