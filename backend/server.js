import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import libre from 'libreoffice-convert';
import sharp from 'sharp';
import cors from 'cors';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';


const app = express();
const PORT = 5005;


// === Logger Helper ===
function log(level, message) {
const time = dayjs().format('YYYY-MM-DD HH:mm:ss');
console.log(`[${time}] [${level}] ${message}`);
}

const execPromise = (command, options) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
        });
    });
};

// === Middleware Global untuk Log Request ===
app.use((req, res, next) => {
log('INFO', `[${req.method}] ${req.originalUrl}`);
next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS','DELETE'],
    allowedHeaders: ['Content-Type']
}));


app.listen(5005, ()=> console.log('API on http://localhost:5005'))

app.get('/api/health', (req,res)=> res.json({ok:true}))

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

// ✅ 1. Word to PDF
app.post('/convert-word-to-pdf', upload.single('file'), (req, res) => {
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = path.resolve(req.file.path);
  const tempPdfPath = `${inputPath}.pdf`;
  const finalPdfPath = `${inputPath}-final.pdf`;

  log('INFO', `📄 Menerima file Word: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  try {
    const wordBuffer = fs.readFileSync(inputPath);
    log('INFO', '🔄 Menjalankan LibreOffice untuk konversi Word ke PDF...');

    libre.convert(wordBuffer, '.pdf', undefined, (err, done) => {
      fs.unlinkSync(inputPath); // hapus file Word asli

      if (err) {
        log('ERROR', `❌ LibreOffice error: ${err.message}`);
        return res.status(500).send('Conversion failed.');
      }

      // Simpan hasil PDF sementara
      fs.writeFileSync(tempPdfPath, done);
      log('INFO', '✅ File sementara PDF berhasil dibuat. Menjalankan Ghostscript...');

      const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${finalPdfPath}" "${tempPdfPath}"`;

      exec(gsCommand, (err, stdout, stderr) => {
        fs.unlinkSync(tempPdfPath); // hapus file sementara

        if (err) {
          log('ERROR', `Ghostscript error: ${stderr}`);
          return res.status(500).send('Failed to convert to PDF 1.4.');
        }

        const finalBuffer = fs.readFileSync(finalPdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
        res.send(finalBuffer);

        log('SUCCESS', '🎉 Konversi Word ke PDF selesai.');
        log('INFO', '🧹 Membersihkan file sementara...');
        fs.unlinkSync(finalPdfPath);
      });
    });
  } catch (error) {
    log('ERROR', `Terjadi kesalahan saat konversi Word ke PDF: ${error.message}`);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    if (fs.existsSync(finalPdfPath)) fs.unlinkSync(finalPdfPath);
    res.status(500).send('Internal Server Error.');
  }
});

// ✅ 2. PDF to Word
app.post('/convert-pdf-to-word', upload.single('file'), async (req, res) => {
  // 1️⃣ Validasi Awal
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  log('INFO', `📄 Menerima file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  const inputPath = req.file.path;
  const outputDir = path.dirname(inputPath);
  const outputFilename = `${path.basename(inputPath)}.docx`;
  const outputPath = path.join(outputDir, outputFilename);

  try {
    // 2️⃣ Persiapan & Eksekusi Perintah
    const command = `libreoffice --headless --infilter="writer_pdf_import" --convert-to docx:"MS Word 2007 XML" --outdir "${outputDir}" "${inputPath}"`;

    log('INFO', '🔄 Menjalankan LibreOffice...');
    log('INFO', command);

    const { stdout, stderr } = await execPromise(command, { timeout: 60000 }); // Timeout 1 menit

    if (stdout.trim()) log('INFO', `Output dari LibreOffice (stdout): ${stdout.trim()}`);
    if (stderr.trim()) log('WARN', `Pesan dari LibreOffice (stderr): ${stderr.trim()}`);

    // 3️⃣ Verifikasi Hasil
    log('SUCCESS', '✅ Konversi selesai. Memeriksa file output...');
    if (!fs.existsSync(outputPath)) {
      throw new Error('File output tidak berhasil dibuat oleh LibreOffice.');
    }

    // 4️⃣ Kirim File ke User
    log('INFO', `📦 File ditemukan di: ${outputPath}. Mengirim ke user...`);
    const docxBuffer = fs.readFileSync(outputPath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="converted.docx"`);
    res.send(docxBuffer);

    log('SUCCESS', '🎉 File berhasil dikirim ke user.');

  } catch (error) {
    // 5️⃣ Penanganan Error
    log('ERROR', `❌ Terjadi kesalahan saat konversi PDF ke Word: ${error.message}`);
    res.status(500).send('Gagal melakukan konversi. Cek log server untuk detail.');
  } finally {
    // 6️⃣ Cleanup
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
  }
});

// ✅ 3. JPG to PDF
app.post('/convert-jpg-to-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const imageBytes = fs.readFileSync(inputPath);
  const tempPDFPath = `${inputPath}.temp.pdf`;
  const finalPDFPath = `${inputPath}.final.pdf`;

  log('INFO', `🖼️ Menerima gambar: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB, format: ${ext})`);

  try {
    // 1️⃣ Buat dokumen PDF baru
    const pdfDoc = await PDFDocument.create();
    let embeddedImage;

    if (ext === '.jpg' || ext === '.jpeg') {
      log('INFO', '📥 Menyematkan gambar JPG ke dalam PDF...');
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else if (ext === '.png') {
      log('INFO', '📥 Menyematkan gambar PNG ke dalam PDF...');
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      throw new Error(`Format gambar tidak didukung: ${ext}`);
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, { x: 0, y: 0, width, height });

    // 2️⃣ Simpan hasil PDF sementara
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(tempPDFPath, pdfBytes);
    log('INFO', `✅ PDF sementara berhasil dibuat (${tempPDFPath}). Menjalankan Ghostscript untuk downgrade ke PDF 1.4...`);

    // 3️⃣ Downgrade ke PDF 1.4 pakai Ghostscript
    const gsCmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${finalPDFPath}" "${tempPDFPath}"`;
    exec(gsCmd, (err, stdout, stderr) => {
      if (err) {
        log('ERROR', `❌ Ghostscript error: ${stderr}`);
        return res.status(500).send('Failed to convert to PDF 1.4');
      }

      // 4️⃣ Kirim hasil ke user
      const finalBuffer = fs.readFileSync(finalPDFPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
      res.send(finalBuffer);

      log('SUCCESS', '🎉 Gambar berhasil dikonversi menjadi PDF versi 1.4.');
      log('INFO', '🧹 Membersihkan file sementara...');
      [inputPath, tempPDFPath, finalPDFPath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    });

  } catch (err) {
    log('ERROR', `❌ Gagal mengonversi gambar ke PDF: ${err.message}`);
    res.status(500).send('Conversion failed');
    [inputPath, tempPDFPath, finalPDFPath].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
  }
});

// ✅ 4. PDF to JPG
app.post('/convert-pdf-to-jpg', upload.single('file'), (req, res) => {
  // 1️⃣ Validasi awal
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const outputBase = inputPath.replace(/\.[^/.]+$/, '');
  const outputJpg = `${outputBase}.jpg`; // hasil dari pdftoppm -singlefile
  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  // 2️⃣ Jalankan perintah konversi PDF → JPG
  const command = `pdftoppm "${inputPath}" "${outputBase}" -jpeg -singlefile`;
  log('INFO', '🔄 Menjalankan pdftoppm untuk mengonversi PDF ke JPG...');

  exec(command, (err, stdout, stderr) => {
    // Hapus file PDF input setelah proses
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

    if (err) {
      log('ERROR', `❌ pdftoppm error: ${stderr}`);
      return res.status(500).send('pdftoppm Conversion failed.');
    }

    try {
      // 3️⃣ Baca hasil JPG
      log('INFO', `📸 Membaca hasil JPG: ${outputJpg}`);
      const jpgBuffer = fs.readFileSync(outputJpg);

      // 4️⃣ Kirim ke user
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline; filename=converted.jpg');
      res.send(jpgBuffer);

      log('SUCCESS', '🎉 Konversi PDF ke JPG berhasil. File dikirim ke user.');

    } catch (readErr) {
      log('ERROR', `❌ Gagal membaca hasil JPG: ${readErr.message}`);
      res.status(500).send('JPG output not found.');
    } finally {
      // 5️⃣ Cleanup file sementara
      log('INFO', '🧹 Membersihkan file JPG sementara...');
      if (fs.existsSync(outputJpg)) fs.unlinkSync(outputJpg);
    }
  });
});


// ✅ 5. PNG to JPG
app.post('/convert-png-to-jpg', upload.single('file'), (req, res) => {
  // 1️⃣ Validasi awal
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  log('INFO', `🖼️ Menerima gambar: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  // 2️⃣ Proses konversi PNG → JPG
  log('INFO', '🔄 Menjalankan Sharp untuk konversi PNG ke JPG...');

  sharp(inputPath)
    .jpeg()
    .toBuffer((err, buffer) => {
      try {
        // Cleanup file PNG asli
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          log('INFO', '🧹 File PNG asli dihapus setelah konversi.');
        }
      } catch (unlinkErr) {
        log('WARN', `Gagal menghapus file asli: ${unlinkErr.message}`);
      }

      // 3️⃣ Tangani error Sharp
      if (err) {
        log('ERROR', `❌ Sharp conversion error: ${err.message}`);
        return res.status(500).send('Conversion failed.');
      }

      // 4️⃣ Kirim hasil JPG
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline; filename=converted.jpg');
      res.send(buffer);

      log('SUCCESS', '🎉 Konversi PNG ke JPG berhasil dan dikirim ke user.');
    });
});


// ✅ 6. Excel to PDF
app.post('/convert-excel-to-pdf', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const librePdfPath = path.join(outputDir, `${baseName}.pdf`);
    const finalPdfPath = path.join(outputDir, `${baseName}-v1.4.pdf`);

    const libreCommand = `libreoffice --headless --convert-to pdf --outdir ${outputDir} ${inputPath}`;
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${finalPdfPath}" "${librePdfPath}"`;

    exec(libreCommand, (err) => {
        fs.unlinkSync(inputPath); // hapus file excel
        if (err || !fs.existsSync(librePdfPath)) {
            return res.status(500).send('LibreOffice conversion failed.');
        }

        exec(gsCommand, (err) => {
            fs.unlinkSync(librePdfPath); // hapus file hasil awal
            if (err || !fs.existsSync(finalPdfPath)) {
                return res.status(500).send('Ghostscript conversion failed.');
            }

            const pdfBuffer = fs.readFileSync(finalPdfPath);
            fs.unlinkSync(finalPdfPath); // hapus file akhir
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
            res.send(pdfBuffer);
        });
    });
});

// ✅ 7. Resize JPG
app.post('/resize-file', upload.single('file'), (req, res) => {
  // 1️⃣ Log request awal
  log('INFO', '=== RESIZE FILE ===');
  log('INFO', `Body request: ${JSON.stringify(req.body)}`);

  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).send('No file uploaded.');
  }

  const inputPath = req.file.path;
  const { width, height } = req.body;
  const resizeOptions = {};

  log('INFO', `📷 Menerima file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

  // 2️⃣ Validasi parameter
  if (width) resizeOptions.width = parseInt(width, 10);
  if (height) resizeOptions.height = parseInt(height, 10);

  if (!resizeOptions.width && !resizeOptions.height) {
    log('ERROR', 'Parameter width atau height tidak ditemukan.');
    return res.status(400).send('Width or height must be provided.');
  }

  log('INFO', `🔧 Proses resize dimulai (width: ${resizeOptions.width || '-'}, height: ${resizeOptions.height || '-'})`);

  // 3️⃣ Proses resize menggunakan sharp
  sharp(inputPath)
    .resize(resizeOptions)
    .jpeg()
    .toBuffer((err, buffer) => {
      // Cleanup file input
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

      if (err) {
        log('ERROR', `❌ Resize gagal: ${err.message}`);
        return res.status(500).send('Resize failed.');
      }

      // 4️⃣ Kirim hasil ke user
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline; filename=resized.jpg');
      res.send(buffer);

      log('SUCCESS', '🎉 Resize gambar berhasil dan hasil dikirim ke user.');
      log('INFO', '🧹 File sementara sudah dihapus.');
    });
});


// ✅ 8. Resize PDF / Kompres
// app.post('/resize-pdf', upload.single('pdfFile'), (req, res) => {
//     console.log(req.body); // Log request body untuk debugging
//     const inputPath = req.file.path;
//     const outputPath = `${inputPath}-compressed.pdf`;

//     const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;
//     exec(cmd, (err) => {
//         fs.unlinkSync(inputPath);
//         if (err) return res.status(500).send('Compression failed.');

//         const buffer = fs.readFileSync(outputPath);
//         fs.unlinkSync(outputPath);
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'inline; filename=compressed.pdf');
//         res.send(buffer);
//     });
// });

// ✅ 9. PDF Version Downgrade
// app.post('/convert', upload.single('pdfFile'), (req, res) => {
//   // Log aman untuk single/array
//   const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
//   console.log('received fields:', files.map(f => f.fieldname));
  
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded. Field name must be "pdfFile".' });
//   }
//   const inputPath = req.file.path;
//   const outputPath = `converted_${Date.now()}.pdf`;


//     const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -sOutputFile=${outputPath} -f ${inputPath}`;
//     exec(cmd, (error) => {
//         fs.unlinkSync(inputPath);
//         if (error) return res.status(500).send('PDF conversion failed.');

//         const buffer = fs.readFileSync(outputPath);
//         fs.unlinkSync(outputPath);
        
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
//         res.send(buffer);
//     });
// });

app.post('/convert-pdf-version', upload.single('file'), async (req, res) => {
  log('INFO', '=== CONVERT PDF VERSION ===');

  // 1️⃣ Validasi file
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const targetVersion = req.body.version;
  const inputPath = req.file.path;

  // 2️⃣ Validasi parameter version
  if (!targetVersion) {
    log('ERROR', 'Parameter "version" tidak ditemukan.');
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: 'Parameter "version" is required',
      validVersions: ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0']
    });
  }

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPdf = path.join(outputDir, `${baseName}-v${targetVersion}.pdf`);

  log('INFO', `📄 Menerima file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);
  log('INFO', `🎯 Target versi PDF: ${targetVersion}`);

  try {
    // 3️⃣ Validasi versi PDF yang diizinkan
    const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    if (!validVersions.includes(targetVersion)) {
      throw new Error(`Invalid version. Valid versions: ${validVersions.join(', ')}`);
    }

    // 4️⃣ Jalankan perintah Ghostscript
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=${targetVersion} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputPdf}" "${inputPath}"`;
    log('INFO', '🔄 Menjalankan Ghostscript untuk mengubah versi PDF...');
    log('INFO', command);

    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 5️⃣ Kirim hasil PDF ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=converted-v${targetVersion}.pdf`);
    res.send(pdfBuffer);

    log('SUCCESS', `✅ Konversi versi PDF selesai ke versi ${targetVersion}`);
  } catch (error) {
    log('ERROR', `❌ Gagal mengonversi versi PDF: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    // 6️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPdf].forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        log('WARN', `Gagal menghapus file: ${e.message}`);
      }
    });
  }
});


// ============================================
// 2. COMPRESS PDF (dengan quality options)
// ============================================
app.post('/compress-pdf', upload.single('file'), async (req, res) => {
  log('INFO', '=== COMPRESS PDF ===');

  // 1️⃣ Validasi file upload
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const quality = req.body.quality;
  const inputPath = req.file.path;

  // 2️⃣ Validasi parameter quality
  if (!quality) {
    log('ERROR', 'Parameter "quality" tidak ditemukan.');
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: 'Parameter "quality" is required',
      validQuality: ['screen', 'ebook', 'printer', 'prepress']
    });
  }

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPdf = path.join(outputDir, `${baseName}-compressed.pdf`);

  log('INFO', `📄 Menerima file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  log('INFO', `🎯 Target kualitas kompresi: ${quality}`);

  try {
    // 3️⃣ Mapping pengaturan kualitas Ghostscript
    const qualitySettings = {
      'screen': '/screen',      // Smallest - 72 dpi
      'ebook': '/ebook',        // Medium - 150 dpi
      'printer': '/printer',    // High - 300 dpi
      'prepress': '/prepress'   // Highest - 300 dpi + color
    };

    if (!qualitySettings[quality]) {
      throw new Error(`Invalid quality. Valid options: ${Object.keys(qualitySettings).join(', ')}`);
    }

    // 4️⃣ Jalankan Ghostscript untuk kompresi PDF
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${qualitySettings[quality]} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputPdf}" "${inputPath}"`;
    log('INFO', '🔄 Menjalankan Ghostscript untuk kompresi PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 5️⃣ Ambil info ukuran sebelum & sesudah
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPdf);
    const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);

    log('SUCCESS', `✅ Kompresi selesai dalam ${duration}s`);
    log('INFO', `📦 Sebelum: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
    log('INFO', `📉 Sesudah: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    log('INFO', `💡 Penghematan: ${compressionRatio}%`);

    // 6️⃣ Kirim hasil PDF ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=compressed-${quality}.pdf`);
    res.setHeader('X-Original-Size', inputStats.size.toString());
    res.setHeader('X-Compressed-Size', outputStats.size.toString());
    res.setHeader('X-Compression-Ratio', compressionRatio);
    res.send(pdfBuffer);

    log('SUCCESS', '🎉 File hasil kompresi berhasil dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Gagal mengompres PDF: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    // 7️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPdf].forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        log('WARN', `Gagal menghapus file: ${e.message}`);
      }
    });
  }
});


// ============================================
// 3. OPTIMIZE PDF (for web/fast loading)
// ============================================
app.post('/optimize-pdf', upload.single('file'), async (req, res) => {
  log('INFO', '=== OPTIMIZE PDF ===');

  // 1️⃣ Validasi file upload
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPdf = path.join(outputDir, `${baseName}-optimized.pdf`);

  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

  try {
    // 2️⃣ Jalankan perintah Ghostscript untuk optimasi
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -dQUIET \
-dCompressFonts=true -dSubsetFonts=true -dEmbedAllFonts=true -dDetectDuplicateImages=true \
-dAutoRotatePages=/None -sOutputFile="${outputPdf}" "${inputPath}"`;

    log('INFO', '⚙️ Menjalankan Ghostscript untuk optimasi PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 3️⃣ Ambil ukuran file sebelum dan sesudah optimasi
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPdf);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);

    log('SUCCESS', `✅ Optimasi selesai dalam ${duration}s`);
    log('INFO', `📦 Sebelum: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
    log('INFO', `📉 Sesudah: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    log('INFO', `💡 Pengurangan ukuran: ${reduction}%`);

    // 4️⃣ Kirim hasil ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=optimized.pdf');
    res.setHeader('X-Original-Size', inputStats.size.toString());
    res.setHeader('X-Optimized-Size', outputStats.size.toString());
    res.setHeader('X-Size-Reduction', reduction);
    res.send(pdfBuffer);

    log('SUCCESS', '🎉 File hasil optimasi berhasil dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Gagal mengoptimasi PDF: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    // 5️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPdf].forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        log('WARN', `Gagal menghapus file: ${e.message}`);
      }
    });
  }
});


// ============================================
// 1. SPLIT PDF - Split by page ranges
// ============================================
app.post('/split-pdf', upload.single('file'), async (req, res) => {
  log('INFO', '=== SPLIT PDF ===');

  // 1️⃣ Validasi file upload
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { pages } = req.body;
  const inputPath = req.file.path;

  // 2️⃣ Validasi parameter pages
  if (!pages) {
    log('ERROR', 'Parameter "pages" tidak ditemukan.');
    fs.unlinkSync(inputPath);
    return res.status(400).json({
      error: 'Parameter "pages" is required',
      example: 'pages=1-3 or pages=1,3,5 or pages=1-3,5-7'
    });
  }

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPdf = path.join(outputDir, `${baseName}-split.pdf`);

  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  log('INFO', `📑 Halaman yang akan diambil: ${pages}`);

  try {
    // 3️⃣ Jalankan qpdf untuk split halaman
    const command = `qpdf "${inputPath}" --pages "${inputPath}" ${pages} -- "${outputPdf}"`;
    log('INFO', '🔄 Menjalankan qpdf untuk memisahkan halaman PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 4️⃣ Kirim hasil split ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=split-pages-${pages}.pdf`);
    res.send(pdfBuffer);

    log('SUCCESS', `✅ PDF berhasil di-split (halaman: ${pages}) dalam ${duration}s`);
    log('SUCCESS', '🎉 File hasil split dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Split PDF gagal: ${error.message}`);
    res.status(500).json({
      error: 'Split failed. Make sure qpdf is installed.',
      details: error.message
    });
  } finally {
    // 5️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPdf].forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        log('WARN', `Gagal menghapus file: ${e.message}`);
      }
    });
  }
});


// ============================================
// 2. SPLIT PDF - Split into individual pages
// ============================================
app.post('/split-pdf', upload.single('pdf'), async (req, res) => {
  log('INFO', '=== SPLIT PDF INTO PAGES ===');

  // 1️⃣ Validasi file upload
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));

  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

  try {
    // 2️⃣ Jalankan qpdf untuk split semua halaman
    const command = `qpdf "${inputPath}" --split-pages "${outputDir}/${baseName}-page-%d.pdf"`;
    log('INFO', '🔄 Menjalankan qpdf untuk memisahkan setiap halaman PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 3️⃣ Cari semua file hasil split
    const files = fs
      .readdirSync(outputDir)
      .filter(f => f.startsWith(`${baseName}-page-`) && f.endsWith('.pdf'));

    if (files.length === 0) {
      throw new Error('Tidak ada file output yang dihasilkan.');
    }

    log('SUCCESS', `✅ PDF berhasil di-split menjadi ${files.length} halaman dalam ${duration}s`);

    // 4️⃣ Buat ZIP dari semua file hasil split
    log('INFO', '📦 Mengarsipkan hasil split menjadi file ZIP...');
    const archiver = require('archiver');
    const zipPath = path.join(outputDir, `${baseName}-split.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      throw err;
    });

    output.on('close', () => {
      const zipBuffer = fs.readFileSync(zipPath);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${baseName}-split.zip`);
      res.send(zipBuffer);

      log('SUCCESS', `🎉 File ZIP (${files.length} halaman) berhasil dikirim ke user.`);
      log('INFO', '🧹 Membersihkan file sementara...');
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        files.forEach(f => fs.existsSync(path.join(outputDir, f)) && fs.unlinkSync(path.join(outputDir, f)));
      } catch (cleanupErr) {
        log('WARN', `Gagal menghapus file hasil split: ${cleanupErr.message}`);
      }
    });

    archive.pipe(output);
    files.forEach(file => {
      archive.file(path.join(outputDir, file), { name: file });
    });
    archive.finalize();

  } catch (error) {
    log('ERROR', `❌ Split PDF gagal: ${error.message}`);
    res.status(500).json({
      error: 'Split failed. Make sure qpdf is installed.',
      details: error.message,
    });
  } finally {
    // 5️⃣ Cleanup file input
    try {
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
        log('INFO', '🧹 File input PDF dihapus setelah proses selesai.');
      }
    } catch (e) {
      log('WARN', `Gagal menghapus file input: ${e.message}`);
    }
  }
});

// ============================================
// 3. MERGE PDF - Using pdf-lib
// ============================================
app.post('/merge-pdf', upload.array('pdfFiles', 10), async (req, res) => {
  log('INFO', '=== MERGE PDF ===');

  // 1️⃣ Validasi minimal 2 file
  if (!req.files || req.files.length < 2) {
    log('ERROR', 'Minimal 2 file PDF diperlukan untuk proses merge.');

    // Cleanup uploaded files
    if (req.files) {
      req.files.forEach(file => {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
      });
    }

    return res.status(400).json({
      error: 'At least 2 PDF files required',
      note: 'Use field name "pdfFiles" for multiple files'
    });
  }

  const outputDir = path.dirname(req.files[0].path);
  const outputPdf = path.join(outputDir, `merged-${Date.now()}.pdf`);

  log('INFO', `📦 Menerima ${req.files.length} file untuk digabung.`);
  req.files.forEach((f, i) => log('INFO', `   [${i + 1}] ${f.originalname} (${(f.size / 1024 / 1024).toFixed(2)} MB)`));

  try {
    // 2️⃣ Proses merge menggunakan pdf-lib
    const startTime = Date.now();
    const mergedPdf = await PDFDocument.create();

    log('INFO', '🔄 Menggabungkan semua file PDF...');
    for (const file of req.files) {
      log('INFO', `📄 Memproses: ${file.originalname}`);
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    fs.writeFileSync(outputPdf, mergedPdfBytes);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log('SUCCESS', `✅ Merge selesai dalam ${duration}s (${req.files.length} file digabung).`);

    // 3️⃣ Kirim hasil ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(pdfBuffer);

    log('SUCCESS', '🎉 File hasil merge berhasil dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Merge PDF gagal: ${error.message}`);
    res.status(500).json({
      error: 'Merge failed',
      details: error.message
    });
  } finally {
    // 4️⃣ Cleanup semua file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    if (req.files) {
      req.files.forEach(file => {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {
          log('WARN', `Gagal menghapus file upload: ${file.originalname}`);
        }
      });
    }
    try {
      if (fs.existsSync(outputPdf)) fs.unlinkSync(outputPdf);
      log('INFO', '🧹 File hasil merge sementara dihapus.');
    } catch (e) {
      log('WARN', `Gagal menghapus file hasil merge: ${e.message}`);
    }
  }
});

// ============================================
// 4. MERGE PDF - Using qpdf (alternative, faster for large files)
// ============================================
app.post('/merge-pdf-qpdf', upload.array('pdfFiles', 10), async (req, res) => {
  log('INFO', '=== MERGE PDF (QPDF) ===');

  // 1️⃣ Validasi file upload
  if (!req.files || req.files.length < 2) {
    log('ERROR', 'Minimal 2 file PDF diperlukan untuk proses merge.');

    // Cleanup file upload yang sudah ada
    if (req.files) {
      req.files.forEach(file => {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {
          log('WARN', `Gagal menghapus file upload: ${file.originalname}`);
        }
      });
    }

    return res.status(400).json({
      error: 'At least 2 PDF files required',
      note: 'Use field name "pdfFiles" for multiple files'
    });
  }

  const outputDir = path.dirname(req.files[0].path);
  const outputPdf = path.join(outputDir, `merged-${Date.now()}.pdf`);

  log('INFO', `📦 Menerima ${req.files.length} file untuk digabung menggunakan QPDF.`);
  req.files.forEach((f, i) => log('INFO', `   [${i + 1}] ${f.originalname} (${(f.size / 1024 / 1024).toFixed(2)} MB)`));

  try {
    // 2️⃣ Bangun perintah qpdf untuk merge
    const inputFiles = req.files.map(f => `"${f.path}"`).join(' ');
    const command = `qpdf --empty --pages ${inputFiles} -- "${outputPdf}"`;
    log('INFO', '🔄 Menjalankan QPDF untuk menggabungkan file PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 20 * 1024 * 1024, timeout: 120000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 3️⃣ Kirim hasil PDF ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(pdfBuffer);

    log('SUCCESS', `✅ Merge PDF selesai dalam ${duration}s (${req.files.length} file digabung).`);
    log('SUCCESS', '🎉 File hasil merge berhasil dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Merge PDF gagal: ${error.message}`);
    res.status(500).json({
      error: 'Merge failed. Make sure qpdf is installed.',
      details: error.message
    });
  } finally {
    // 4️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    if (req.files) {
      req.files.forEach(file => {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {
          log('WARN', `Gagal menghapus file upload: ${e.message}`);
        }
      });
    }
    try {
      if (fs.existsSync(outputPdf)) fs.unlinkSync(outputPdf);
      log('INFO', '🧹 File hasil merge sementara dihapus.');
    } catch (e) {
      log('WARN', `Gagal menghapus file hasil merge: ${e.message}`);
    }
  }
});

// ============================================
// 5. ROTATE PDF PAGES
// ============================================
app.post('/rotate-pdf', upload.single('file'), async (req, res) => {
  log('INFO', '=== ROTATE PDF ===');

  // 1️⃣ Validasi file upload
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { angle, pages } = req.body;
  const inputPath = req.file.path;

  // 2️⃣ Validasi parameter angle
  if (!angle) {
    log('ERROR', 'Parameter "angle" tidak ditemukan.');
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: 'Parameter "angle" is required',
      validAngles: ['90', '180', '270'],
      example: 'angle=90&pages=1-3 (pages optional, default: all)'
    });
  }

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPdf = path.join(outputDir, `${baseName}-rotated.pdf`);

  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  log('INFO', `🔁 Sudut rotasi: ${angle} derajat`);
  log('INFO', `📑 Halaman yang akan diputar: ${pages || 'semua halaman (1-z)'}`);

  try {
    // 3️⃣ Validasi sudut rotasi yang diperbolehkan
    const validAngles = ['90', '180', '270'];
    if (!validAngles.includes(angle)) {
      throw new Error(`Invalid angle. Valid: ${validAngles.join(', ')}`);
    }

    // 4️⃣ Jalankan qpdf untuk rotasi halaman
    const command = `qpdf "${inputPath}" --rotate=${angle}:${pages || '1-z'} "${outputPdf}"`;
    log('INFO', '🔄 Menjalankan QPDF untuk memutar halaman PDF...');
    log('INFO', command);

    const startTime = Date.now();
    await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!fs.existsSync(outputPdf)) {
      throw new Error('Output PDF tidak berhasil dibuat.');
    }

    // 5️⃣ Kirim hasil rotasi ke user
    const pdfBuffer = fs.readFileSync(outputPdf);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rotated-${angle}.pdf`);
    res.send(pdfBuffer);

    log('SUCCESS', `✅ PDF berhasil diputar ${angle}° dalam ${duration}s`);
    log('SUCCESS', '🎉 File hasil rotasi berhasil dikirim ke user.');

  } catch (error) {
    log('ERROR', `❌ Rotasi PDF gagal: ${error.message}`);
    res.status(500).json({
      error: 'Rotation failed. Make sure qpdf is installed.',
      details: error.message
    });
  } finally {
    // 6️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    [inputPath, outputPdf].forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {
        log('WARN', `Gagal menghapus file: ${e.message}`);
      }
    });
  }
});

// ============================================
// 6. GET PDF INFO (page count, size, version)
// ============================================
app.post('/pdf-info', upload.single('file'), async (req, res) => {
  log('INFO', '=== PDF INFO ===');

  // 1️⃣ Validasi upload file
  if (!req.file) {
    log('ERROR', 'Tidak ada file yang diupload.');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  log('INFO', `📄 Menerima file PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

  try {
    // 2️⃣ Baca metadata dari PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    log('INFO', '📖 Membaca informasi metadata dari PDF...');

    const info = {
      filename: req.file.originalname,
      size: req.file.size,
      sizeFormatted: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || 'N/A',
      author: pdfDoc.getAuthor() || 'N/A',
      subject: pdfDoc.getSubject() || 'N/A',
      creator: pdfDoc.getCreator() || 'N/A',
      producer: pdfDoc.getProducer() || 'N/A',
      creationDate: pdfDoc.getCreationDate() || 'N/A',
      modificationDate: pdfDoc.getModificationDate() || 'N/A'
    };

    // 3️⃣ Tampilkan ringkasan di log terminal
    log('SUCCESS', '✅ Informasi PDF berhasil dibaca:');
    log('INFO', `   📚 Jumlah halaman: ${info.pageCount}`);
    log('INFO', `   🏷️ Judul: ${info.title}`);
    log('INFO', `   ✍️ Penulis: ${info.author}`);
    log('INFO', `   🧠 Pembuat: ${info.creator}`);
    log('INFO', `   🏭 Produser: ${info.producer}`);
    log('INFO', `   📅 Dibuat: ${info.creationDate}`);
    log('INFO', `   ✏️ Diedit: ${info.modificationDate}`);

    // 4️⃣ Kirim hasil JSON ke user
    res.json(info);

  } catch (error) {
    log('ERROR', `❌ Gagal membaca metadata PDF: ${error.message}`);
    res.status(500).json({
      error: 'Failed to read PDF info',
      details: error.message
    });
  } finally {
    // 5️⃣ Cleanup file sementara
    log('INFO', '🧹 Membersihkan file sementara...');
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    } catch (e) {
      log('WARN', `Gagal menghapus file: ${e.message}`);
    }
  }
});

// ============================================
// ADD SIGNATURE (Drag & Drop + Upload/Draw Support)
// ============================================
app.post('/add-signature', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('\n=== ADD SIGNATURE ===');


    const pdfPath = req.files['file']?.[0]?.path;
    const signPath = req.files['signature']?.[0]?.path;


    // GET SIZE & ROTATION dari request
    const { x, y, page, width, height, rotation } = req.body;


    if (!pdfPath || !signPath) {
      return res.status(400).json({ error: 'Missing PDF or signature image.' });
    }


    console.log('📥 Input:', { x, y, page, width, height, rotation });


    // Load PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);


    // Get target page
    const pageIndex = parseInt(page || '1', 10) - 1;
    const pdfPage = pdfDoc.getPages()[pageIndex];


    if (!pdfPage) {
      throw new Error(`Page ${page} not found`);
    }


    // Get page dimensions
    const { width: pageWidth, height: pageHeight } = pdfPage.getSize();
    console.log('📐 Page size:', { pageWidth, pageHeight });


    // Embed signature
    const signBytes = fs.readFileSync(signPath);
    const signatureImage = await pdfDoc.embedPng(signBytes);


    // Parse signature size & rotation
    const sigWidth = parseFloat(width) || 120;
    const sigHeight = parseFloat(height) || 50;
    const sigRotation = parseFloat(rotation) || 0;


    // Convert percentage to PDF coordinates
    const xPercent = parseFloat(x);
    const yPercent = parseFloat(y);


    console.log('📊 Percentage:', { xPercent, yPercent });
    console.log('📏 Signature:', { sigWidth, sigHeight, sigRotation });


    // PDF origin = BOTTOM-LEFT, Browser origin = TOP-LEFT
    const pdfX = (xPercent / 100) * pageWidth - (sigWidth / 2);
    const pdfY = pageHeight - ((yPercent / 100) * pageHeight) - (sigHeight / 2);


    console.log('🎯 PDF coords:', { pdfX, pdfY });


    // Draw signature dengan rotation
    pdfPage.drawImage(signatureImage, {
      x: pdfX,
      y: pdfY,
      width: sigWidth,
      height: sigHeight,
      rotate: {
        type: 'degrees',
        angle: sigRotation
      }
    });


    // Save
    const signedPdfBytes = await pdfDoc.save();
    const outputPath = `uploads/signed_${Date.now()}.pdf`;
    fs.writeFileSync(outputPath, signedPdfBytes);


    console.log('✅ Success!');


    // Send file
    res.download(outputPath, 'signed.pdf', () => {
      [pdfPath, signPath, outputPath].forEach(f => {
        try { 
          if (fs.existsSync(f)) fs.unlinkSync(f); 
        } catch (e) {}
      });
    });


  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: 'Failed to add signature.',
      details: error.message 
    });


    // Cleanup on error
    const pdfPath = req.files['file']?.[0]?.path;
    const signPath = req.files['signature']?.[0]?.path;
    if (pdfPath) try { fs.unlinkSync(pdfPath); } catch (e) {}
    if (signPath) try { fs.unlinkSync(signPath); } catch (e) {}
  }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server jalan di http://127.0.0.1:${PORT}`);
});