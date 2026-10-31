# Stylora

Boilerplate Next.js App Router + TypeScript untuk demo styling dalam 7 jam oleh 4 developer. UI memakai React dan Tailwind CSS; validasi Zod; React Hook Form tersedia untuk form panjang. Data memakai Supabase PostgreSQL dan hosting ditujukan ke Vercel.

Sesuai scope saat ini, aplikasi **tanpa login** memakai satu workspace demo bersama. Semua pengunjung dapat mengubah data yang sama. Gunakan data sintetis saja; jangan masukkan foto atau informasi pribadi. Ini bukan sistem wardrobe privat per pengguna.

## Mulai

Gunakan Node.js 22 LTS dan npm. Commit lockfile dan gunakan instalasi yang dapat diulang:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Isi environment sesuai `.env.example`. `SUPABASE_SECRET_KEY` hanya untuk server; `STYLORA_WORKSPACE_ID` memilih workspace tetap di server. Jangan beri prefix `NEXT_PUBLIC_` pada secret. Belum ada project cloud yang dipilih atau deployment yang dilakukan oleh setup ini.

Jika memakai Supabase lokal, jalankan Docker lebih dahulu:

```powershell
npm run db:start
npm run db:reset
npm run db:types
npm run db:test
```

Reset hanya untuk database lokal yang boleh dihapus. Ikuti [runbook deployment](docs/deployment.md) untuk cloud linking dan environment sebelum menjalankan aplikasi dengan resource cloud.

```powershell
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan

```powershell
npm run check
npm run build
```

Script individual: `lint`, `typecheck`, `test`, serta `db:test` untuk kebijakan database. Build berhasil tidak membuktikan koneksi cloud, upload, atau alur produk telah lulus end-to-end. Hasil pemeriksaan aktual dicatat pada handoff.

## Struktur

```text
src/app/             route/layout dan HTTP handler tipis
src/features/        schema, UI, query, dan aksi per fitur
src/components/ui/   primitive yang dipakai bersama
src/lib/supabase/    akses Supabase server-only
src/lib/env.ts       validasi environment
src/types/           kontrak database
supabase/            config, migrations, seed, tes kebijakan
docs/                arsitektur, sprint, deployment, skills
```

Routes tersedia sebagai fondasi: `/create`, `/looks/[lookId]`, `/wardrobe`, `/capsules`, `/saved-looks`, `/preferences`, `/profile`, `/shared/[shareToken]`. Route bukan bukti fitur lengkap. Profile tidak menyatakan adanya identitas akun; sharing dan AI nyata masih pengembangan berikutnya.

## Dokumen tim

- [Product requirements and scope](PRD.md)
- [Arsitektur](docs/architecture.md)
- [Pembagian 4 developer dan jadwal 7 jam](docs/sprint-plan.md)
- [Deployment](docs/deployment.md)
- [Instruksi agent](AGENTS.md) dan [skills](docs/skills.md)

## Token visual

| Token | Hex | Peran |
| --- | --- | --- |
| Porcelain | `#F5F2EC` | Latar utama |
| Paper | `#FFFEFC` | Kartu dan panel |
| Near-black | `#211F20` | Teks dan navigasi |
| Oxblood | `#642E3B` | CTA dan selected state |
| Deep wine | `#48212B` | Hover/active CTA |
| Muted mauve | `#A18483` | Aksen kecil, bukan teks utama |
| Stone | `#DCD6CE` | Border/divider |
| Secondary text | `#706A66` | Teks pendukung |

Gunakan token CSS; uji contrast saat menambah kombinasi/opacity. Selected dan error state harus mempunyai petunjuk selain warna.
