/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: FORMULIR TRAINING KARYAWAN -> SPREADSHEET
 * ==============================================================================
 * Petunjuk Penggunaan:
 * 1. Buka Google Sheets baru atau yang sudah ada di Google Drive Anda.
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script".
 * 3. Hapus semua kode default di Apps Script, lalu salin dan tempel SELURUH isi file ini.
 * 4. Klik tombol "Save" (ikon disket).
 * 5. Klik tombol biru "Deploy" di kanan atas > pilih "New deployment".
 * 6. Klik ikon roda gigi (Select type) > pilih "Web app".
 * 7. Konfigurasi deployment:
 *    - Description: Web App Training Form
 *    - Execute as: Me (email akun Anda)
 *    - Who has access: Anyone (PENTING: pilih 'Anyone' agar Vercel/web bisa kirim data)
 * 8. Klik "Deploy" dan izinkan otorisasi akun Google Anda.
 * 9. Salin "Web app URL" (format: https://script.google.com/macros/s/.../exec).
 * 10. Buka formulir Anda (di Vercel / lokal) > klik tombol "Pengaturan Sheet" di kanan atas > tempel URL tersebut.
 * ==============================================================================
 */

const SHEET_NAME = "Training Submissions";

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Buat Sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Periksa dan buat header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Waktu Submit",
        "ID Training",
        "Status",
        "Leader Pengaju",
        "Departemen / Divisi",
        "Kategori Training",
        "Tanggal Pengajuan",
        "Metode Training",
        "Jadwal Pelaksanaan",
        "Lokasi / Venue",
        "Trainer",
        "Jumlah Peserta Terdaftar",
        "Total Durasi Belajar",
        "Estimasi Biaya",
        "Budget Disetujui",
        "Actual Spend",
        "Tujuan & Purpose",
        "Goals",
        "Daftar Peserta (Ringkasan)",
        "Modul & Aktivitas",
        "Approval Status",
        "Raw Data JSON"
      ];
      sheet.appendRow(headers);

      // Berikan style sederhana pada header
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#3F5A44");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }

    // Ambil data payload JSON dari request
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("No data received");
    }

    const meta = data.meta || {};
    const participants = data.participants || [];
    const modules = data.modules || [];
    const approvals = data.approvals || [];

    // Format ringkasan peserta
    const participantsSummary = participants
      .filter(p => p.nama)
      .map((p, idx) => `${idx + 1}. ${p.nama} (${p.departemen || "-"}) - ${p.kehadiran || "-"}`)
      .join("\n");

    // Format ringkasan modul
    const modulesSummary = modules
      .filter(m => m.modul)
      .map((m, idx) => `${idx + 1}. ${m.modul} [${m.durasi || "-"}] PIC: ${m.pic || "-"} (${m.metode || "-"})`)
      .join("\n");

    // Format ringkasan approval
    const approvalsSummary = approvals
      .filter(a => a.role)
      .map((a, idx) => `${idx + 1}. ${a.role}: ${a.nama || "-"} (${a.tanggal || "-"})`)
      .join("\n");

    const rowData = [
      data.submittedAt || new Date().toISOString(),
      meta["ID training"] || "-",
      data.status || "Pending approval",
      meta["Leader pengaju"] || "-",
      meta["Departemen / divisi"] || "-",
      meta["Kategori training"] || "-",
      meta["Tanggal pengajuan"] || "-",
      meta["Metode training"] || "-",
      meta["Tanggal & jam pelaksanaan"] || "-",
      meta["Lokasi / venue"] || "-",
      meta["Trainer"] || "-",
      participants.filter(p => p.nama).length,
      meta["Total durasi belajar"] || "-",
      meta["Estimasi biaya"] || "-",
      meta["Budget disetujui"] || "-",
      meta["Actual spend"] || "-",
      meta["Training plan purpose"] || "-",
      meta["Training goals"] || "-",
      participantsSummary || "-",
      modulesSummary || "-",
      approvalsSummary || "-",
      JSON.stringify(data)
    ];

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Data saved to Google Sheets successfully" })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handler untuk mengembalikan data jika ingin diuji via browser
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }
    const data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
