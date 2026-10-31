# Skills dan kerja agent

Skills membantu proses agent, bukan dependency runtime. Instalasi tiap developer bisa berbeda. Simpan instruksi proyek pada `AGENTS.md`; jangan salin cache skill global, credentials, atau konfigurasi akun pribadi ke repository.

| Pekerjaan                          | Skill relevan                                   | Kapan                                                                                  |
| ---------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Database, RLS, migrations, Storage | `supabase:supabase`                             | Sebelum implementasi dan verifikasi database                                           |
| Query/index/constraint             | `supabase:supabase-postgres-best-practices`     | Saat review query/schema membutuhkan panduan                                           |
| Linking/environment cloud          | `vercel:bootstrap`, `vercel:env-vars`           | Saat menyiapkan resource Vercel yang sebenarnya                                        |
| Preview/CI/promotion               | `vercel:deployments-cicd`                       | Saat menyiapkan atau melakukan deployment                                              |
| CLI Vercel                         | `vercel:vercel-cli`                             | Sebelum mengandalkan CLI platform                                                      |
| Beberapa komponen TSX              | `vercel:react-best-practices`                   | Review hooks, aksesibilitas, client/server boundary                                    |
| Alur yang gagal                    | `vercel:verification`                           | Telusuri browser → server → data → response                                            |
| AI provider                        | Skill SDK/provider sesuai library yang dipilih  | Setelah provider disepakati, bukan karena SDK tersedia                                 |
| Audit/desain                       | Product Design, Mobbin, atau Figma sesuai tugas | Bila tugas desain memerlukan; setup folder tidak otomatis memerlukan eksplorasi visual |

Baca dokumentasi resmi terkini untuk API yang berubah dan cocokkan dengan versi lockfile. Skill auth tidak diperlukan pada scope tanpa login. Skill bukan alasan menambah auth, database lain, atau operasi cloud di luar scope pengguna.

Untuk Next.js pada Vercel, gunakan runtime Node.js bawaan terlebih dahulu. Skill atau contoh yang memakai runtime/queue/database lain tidak menjadi instruksi untuk mengganti arsitektur proyek. Ketika memasang skill tambahan, review scope dan sumbernya; jangan menyimpan token MCP atau konfigurasi akun pribadi pada repo bersama.

## Format tugas agent

```text
Tujuan: hasil konkret yang dapat direview.
Area edit: file/folder milik task.
Kontrak: schema/payload/env yang disepakati.
Batas: file bersama dan operasi remote di luar task.
Verifikasi: checks dan bukti runtime yang relevan.
Handoff: perubahan, hasil checks, keterbatasan, langkah tersisa.
```

Contoh: agent wardrobe membuat form dan query pada modul wardrobe, memakai workspace server tetap, dan mengirim kebutuhan migration kepada pemilik database. Agent tidak membuat tabel alternatif atau menghapus scope query agar tests lolos. Jangan menambah agent melebihi area independen yang dapat direview.
