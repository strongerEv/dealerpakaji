# Dealer Pak Aji 🚗

Aplikasi web (PWA) untuk **Dealer Pak Aji — Jual Beli Mobil Bekas**: stok mobil, simulasi kredit, jual & tukar tambah, booking test drive, dan panel admin untuk mengelola stok serta prospek pembeli.

Desain mengikuti gaya website dealer profesional: top bar kontak, header putih dengan CTA merah, hero foto showroom, panel pencarian, kartu stok, strip keunggulan, promo kredit & tukar tambah, dan footer 4 kolom. Warna navy + merah mengikuti logo.

Dibuat dengan HTML, CSS, dan JavaScript murni — tanpa build, tanpa server. Cukup buka `index.html` atau host di GitHub Pages / Netlify / Vercel.

## Fitur

### Untuk pembeli
- **Beranda** — hero foto showroom, panel "Cari Mobil Anda" (merek → model, tipe, harga), stok per tab, keunggulan, promo kredit & tukar tambah, merek, dan alur pembelian.
- **Stok Mobil** — cari & filter berdasarkan merek, model, tipe, transmisi, tahun, batas harga, dan urutan.
- **Jual & Tukar Tambah** — form taksir mobil pelanggan (jual langsung atau tukar tambah dengan unit di showroom).
- **Detail mobil** — foto, harga, spesifikasi lengkap, fitur, simulasi kredit, mobil serupa.
- **Simulasi kredit** — atur DP (10–70%) dan tenor (1–5 tahun), lihat angsuran, total bayar, dan tabel angsuran.
- **Bandingkan** — bandingkan hingga 3 mobil berdampingan.
- **Favorit** — simpan mobil incaran.
- **Form prospek** — Booking Test Drive, Ajukan Kredit, Tanya Mobil, Jual Mobil, Tukar Tambah. Data tersimpan dan bisa langsung dilanjutkan ke **WhatsApp** dengan pesan otomatis.
- **Bisa di-install** di HP (PWA) dan tetap bisa dibuka saat offline.

### Untuk admin (`#/admin`)
- **Dashboard** — unit tersedia, nilai stok, unit terjual, prospek baru, grafik prospek & stok, mobil paling diminati.
- **Stok Mobil** — tambah / edit / hapus mobil (termasuk upload foto), ubah status (Tersedia, Inden, Booking, Terjual), tandai unggulan.
- **Prospek** — daftar semua permintaan pembeli, ubah status (Baru, Dihubungi, Deal, Batal), hubungi via WhatsApp/telepon, export CSV.
- **Pengaturan** — nama dealer, nomor WhatsApp, alamat, jam operasional (pisahkan hari dengan `;`), Instagram/Facebook, ganti PIN, cadangan & pulihkan data.

PIN admin bawaan: **`1234`** (segera ganti di menu Pengaturan).

## Menjalankan

```bash
# cara paling mudah (butuh Python)
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

## Catatan penting
- Data (stok, prospek, pengaturan) disimpan di **localStorage browser** perangkat yang dipakai. Artinya prospek yang masuk dari HP pembeli tidak otomatis terkirim ke HP admin — karena itu setiap form juga mengarahkan pembeli ke **WhatsApp dealer**. Untuk data terpusat multi-perangkat, langkah berikutnya adalah menyambungkan ke backend (mis. Supabase/Firebase).
- PIN admin hanya pengaman sederhana di sisi browser, bukan sistem keamanan sungguhan.
- Harga pada data awal adalah **estimasi** dan bisa diubah dari panel admin.
- Ganti nomor WhatsApp, alamat, dan kontak di **Admin → Pengaturan** sebelum dipakai.

## Struktur

```
index.html            kerangka aplikasi
css/style.css         desain & tema (terang/gelap, responsif)
js/data.js            data awal stok mobil & pengaturan
js/store.js           penyimpanan localStorage
js/app.js             halaman publik & router
js/admin.js           panel admin
sw.js                 service worker (offline)
manifest.webmanifest  konfigurasi PWA
assets/               logo, ikon, foto hero & foto mobil
```
