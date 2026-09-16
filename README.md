# Formulir Training Karyawan (Internal Plan)

Aplikasi web formulir pengajuan training karyawan internal yang rapi, modern, interaktif, dan siap di-deploy langsung ke **Vercel** dengan penyimpanan data otomatis ke **Google Spreadsheet**.

---

## 📁 Struktur File Proyek

```text
form-training/
├── index.html               # File HTML utama (entry point untuk Vercel)
├── css/
│   └── style.css            # Styling terpisah (layout, font, modul, popup, responsive)
├── js/
│   └── app.js               # Logika interaktif, validasi, modal popup, toast, & sync
├── google-apps-script.js    # Kode siap pakai untuk Google Apps Script (Spreadsheet)
├── README.md                # Panduan deployment dan konfigurasi
└── training_internal_plan.html # File cadangan / backup awal
```

---

## 🚀 1. Cara Deploy ke Vercel

Karena aplikasi ini adalah web statis murni (HTML + CSS + JS) dengan entry point `index.html`, Anda dapat menjalankannya di Vercel dengan sangat mudah:

### Opsi A: Deploy via GitHub (Paling Direkomendasikan)
1. Push folder proyek ini ke repository GitHub Anda.
2. Buka [vercel.com](https://vercel.com) dan login.
3. Klik **"Add New..."** > **"Project"**.
4. Pilih repository GitHub Anda, lalu klik **"Deploy"** (tanpa perlu setting build command apapun).
5. Selesai! Web Anda langsung online dengan domain seperti `https://nama-proyek.vercel.app`.

### Opsi B: Deploy via Vercel CLI
Jalankan perintah berikut di terminal folder ini:
```bash
npm install -g vercel
vercel
```
Ikuti petunjuk di terminal hingga selesai.

---

## 📊 2. Cara Menghubungkan ke Google Spreadsheet

Untuk menyimpan setiap pengajuan training langsung ke Google Spreadsheet:

1. Buat Spreadsheet baru di [Google Sheets](https://sheets.new).
2. Di menu atas, klik **Extensions** (Ekstensi) > **Apps Script**.
3. Hapus kode default yang ada, lalu salin dan tempel seluruh isi file [`google-apps-script.js`](./google-apps-script.js).
4. Klik tombol **Save** (ikon disket).
5. Klik tombol biru **Deploy** di pojok kanan atas > pilih **New deployment**.
6. Klik ikon gear di sebelah kiri **Select type** > pilih **Web app**.
7. Atur konfigurasi:
   - **Description**: `Training Form Backend`
   - **Execute as**: `Me (email akun Anda)`
   - **Who has access**: `Anyone` *(Wajib pilih 'Anyone' agar pengiriman data dari Vercel diizinkan)*.
8. Klik **Deploy**, lalu klik **Authorize access** dan izinkan akun Google Anda.
9. Salin URL Web App yang muncul (format: `https://script.google.com/macros/s/.../exec`).
10. Buka file [`js/app.js`](./js/app.js), lalu tempelkan URL tersebut pada baris atas:
    ```javascript
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
    ```
11. Selesai! Siapa pun yang membuka website Anda di Vercel akan otomatis mengirim datanya langsung ke Google Spreadsheet tersebut.

> **Catatan:** Jika URL belum diisi atau perangkat sedang offline, data submission akan tetap tersimpan secara aman di browser (**Master Data & Riwayat**) sehingga formulir tidak akan kehilangan data.

---

## ✨ 3. Fitur Interaktif Baru

* **Pemisahan File CSS & JS**: HTML bersih, modular, dan mudah dikelola tanpa script inline.
* **Modal Popup Interaktif**:
  * **Modal Konfirmasi Pengajuan**: Menampilkan ringkasan ringkas sebelum data benar-benar dikirim.
  * **Modal Sukses Pengajuan**: Feedback visual elegan dengan opsi cetak / kirim draft email / lihat di riwayat.
  * **Modal PIN Admin**: Pop-up modern untuk melindungi halaman Master Data (PIN default: `ubahpin123`).
  * **Modal Pengaturan Spreadsheet**: Memudahkan ganti URL Google Apps Script kapan saja langsung dari UI.
* **Toast Notification**: Peringatan dan notifikasi instan yang melayang halus di pojok layar.
* **Format Mata Uang Rupiah Otomatis**: Input budget langsung terformat dengan pemisah ribuan (`Rp 1.000.000`) dan menghitung selisih budget otomatis.
* **Tabel Partisipan & Modul Dinamis**: Tambah/hapus baris dengan penomoran otomatis dan tombol toggle kehadiran (*Hadir/Absen*).
* **Export Master Data ke CSV**: Memungkinkan admin mengunduh seluruh riwayat pengajuan dalam format spreadsheet CSV.
* **Responsive & Print-Friendly**: Tampilan otomatis menyesuaikan layar smartphone dan bersih saat dicetak (Ctrl + P).
