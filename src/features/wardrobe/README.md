# Wardrobe

Owner: Developer 2. Contoh implementasi pertama untuk dipakai fitur lain.

- `schema.ts`: validasi input yang boleh dikirim client.
- `repository.ts`: server-only; workspace selalu berasal dari environment.
- `actions.ts`: validasi, write gate, response aman, invalidasi route.
- `components/`: screen server dan form client dengan pending/error state.

Saat ini baru tambah dan daftar metadata (maksimal 100 item terbaru). Update,
delete, pagination dan upload belum diimplementasikan. Form tidak menerima
workspace ID. Semua pengunjung berbagi data demo, tanpa identitas akun.
