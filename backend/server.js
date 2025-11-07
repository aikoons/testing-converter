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


const app = express();
const PORT = 5005;
const execPromise = (command, options) => {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
        });
    });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'OPTIONS','DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.get('/api/health', (req,res)=> res.json({ok:true}))

app.listen(5005, ()=> console.log('API on http://localhost:5005'))

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

// ✅ 1. Word to PDF
app.post('/convert-word-to-pdf', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = path.resolve(req.file.path);
    const outputExt = '.pdf';
    const tempPdfPath = `${inputPath}.pdf`;
    const finalPdfPath = `${inputPath}-final.pdf`;

    const wordBuffer = fs.readFileSync(inputPath);

    libre.convert(wordBuffer, outputExt, undefined, (err, done) => {
        fs.unlinkSync(inputPath); // Hapus file Word

        if (err) {
            console.error('LibreOffice conversion error:', err);
            return res.status(500).send('Conversion failed.');
        }

        // Simpan hasil sementara
        fs.writeFileSync(tempPdfPath, done);

        // Kompresi ke PDF 1.4 pakai Ghostscript
        const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${finalPdfPath}" "${tempPdfPath}"`;

        exec(gsCommand, (err, stdout, stderr) => {
            fs.unlinkSync(tempPdfPath); // Hapus hasil PDF sementara

            if (err) {
                console.error('Ghostscript error:', stderr);
                return res.status(500).send('Failed to convert to PDF 1.4.');
            }

            const finalBuffer = fs.readFileSync(finalPdfPath);
            fs.unlinkSync(finalPdfPath); // Hapus setelah dikirim

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
            res.send(finalBuffer);
        });
    });
});

// ✅ 2. PDF to Word
app.post('/convert-pdf-to-word', upload.single('file'), async (req, res) => {
    // 1. Validasi Awal
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(`📄 Menerima file: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    // Kita tentukan nama file outputnya secara eksplisit
    const outputFilename = `${path.basename(inputPath)}.docx`;
    const outputPath = path.join(outputDir, outputFilename);

    try {
        // 2. Persiapan & Eksekusi Perintah
        // Perintah ini menggunakan filter khusus untuk hasil .docx yang lebih baik
        const command = `libreoffice --headless --infilter="writer_pdf_import" --convert-to docx:"MS Word 2007 XML" --outdir "${outputDir}" "${inputPath}"`;
        
        console.log('🔄 Menjalankan perintah konversi...');
        console.log(command);

        // Jalankan perintah dan tunggu sampai selesai
        const { stdout, stderr } = await execPromise(command, { timeout: 60000 }); // Timeout 1 menit

        console.log('Output dari LibreOffice (stdout):', stdout);
        if (stderr) {
            console.warn('Pesan dari LibreOffice (stderr):', stderr);
        }

        // 3. Verifikasi Hasil
        console.log('✅ Konversi selesai. Memeriksa file output...');
        if (!fs.existsSync(outputPath)) {
            // Jika file tidak ditemukan, ini adalah error kritis.
            throw new Error('File output tidak berhasil dibuat oleh LibreOffice.');
        }

        // 4. Kirim File ke User
        console.log(`📦 File ditemukan di: ${outputPath}. Mengirim ke user...`);
        const docxBuffer = fs.readFileSync(outputPath);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="converted.docx"`);
        res.send(docxBuffer);

    } catch (error) {
        // 5. Penanganan Error
        console.error('❌ TERJADI ERROR SAAT KONVERSI:', error);
        res.status(500).send('Gagal melakukan konversi. Cek log server untuk detail.');

    } finally {
        // 6. Cleanup
        // Selalu hapus file sementara, baik berhasil maupun gagal
        console.log('🧹 Membersihkan file sementara...');
        if (fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    }
});


// ✅ 3. JPG to PDF
app.post('/convert-jpg-to-pdf', upload.single('file'), async (req, res) => {
    const inputPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const imageBytes = fs.readFileSync(inputPath);
    const tempPDFPath = `${inputPath}.temp.pdf`;
    const finalPDFPath = `${inputPath}.final.pdf`;

    try {
        const pdfDoc = await PDFDocument.create();
        let embeddedImage;

        if (ext === '.jpg' || ext === '.jpeg') {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else if (ext === '.png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
            throw new Error('Unsupported image format');
        }

        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, { x: 0, y: 0, width, height });

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(tempPDFPath, pdfBytes);

        // ↓ Downgrade ke PDF versi 1.4 pakai Ghostscript
        const gsCmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${finalPDFPath} ${tempPDFPath}`;
        exec(gsCmd, (err, stdout, stderr) => {
            if (err) {
                console.error('Ghostscript error:', stderr);
                return res.status(500).send('Failed to convert to PDF 1.4');
            }

            const finalBuffer = fs.readFileSync(finalPDFPath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=converted.pdf');
            res.send(finalBuffer);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(tempPDFPath);
            fs.unlinkSync(finalPDFPath);
        });

    } catch (err) {
        console.error('Error:', err.message);
        res.status(500).send('Conversion failed');
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    }
});
// ✅ 4. PDF to JPG
app.post('/convert-pdf-to-jpg', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputBase = inputPath.replace(/\.[^/.]+$/, ''); // nama dasar tanpa ekstensi
    const outputJpg = `${outputBase}.jpg`; // karena pdftoppm nambahin -1, -2, dst

    // -singlefile penting agar hanya 1 output file (halaman pertama)
    const command = `pdftoppm "${inputPath}" "${outputBase}" -jpeg -singlefile`;

    exec(command, (err, stdout, stderr) => {
        fs.unlinkSync(inputPath); // hapus PDF input

        if (err) {
            console.error('pdftoppm error:', stderr);
            return res.status(500).send('Conversion failed.');
        }

        try {
            const jpgBuffer = fs.readFileSync(outputJpg);
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'inline; filename=converted.jpg');
            res.send(jpgBuffer);
            fs.unlinkSync(outputJpg); // hapus file JPG hasil konversi
        } catch (readErr) {
            console.error('Read JPG error:', readErr);
            res.status(500).send('JPG output not found.');
        }
    });
});

// ✅ 5. PNG to JPG
app.post('/convert-png-to-jpg', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;

    sharp(inputPath)
        .jpeg()
        .toBuffer((err, buffer) => {
            try {
                fs.unlinkSync(inputPath); // hapus file PNG asli
            } catch (unlinkErr) {
                console.error('Gagal hapus file:', unlinkErr);
            }

            if (err) {
                console.error('Sharp conversion error:', err);
                return res.status(500).send('Conversion failed.');
            }

            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'inline; filename=converted.jpg');
            res.send(buffer);
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
    console.log(req.body); // Log request body untuk debugging
    console.log('File:', req.file);
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const inputPath = req.file.path;
    const { width, height } = req.body; // Ambil parameter width dan height dari body request

    // Pastikan width dan height valid
    const resizeOptions = {};
    if (width) resizeOptions.width = parseInt(width, 10);  // Pastikan width berupa angka
    if (height) resizeOptions.height = parseInt(height, 10); // Pastikan height berupa angka

    // Jika tidak ada parameter width/height, beri respons error
    if (!resizeOptions.width && !resizeOptions.height) {
        return res.status(400).send('Width or height must be provided.');
    }

    // Proses resize gambar dengan sharp
    sharp(inputPath)
        .resize(resizeOptions)
        .jpeg()
        .toBuffer((err, buffer) => {
            fs.unlinkSync(inputPath);  // Hapus file gambar yang sudah diproses
            if (err) {
                console.error('Resize failed:', err);  // Log error jika terjadi kesalahan dengan sharp
                return res.status(500).send('Resize failed.');
            }

            // Kirim hasil gambar yang sudah di-resize
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'inline; filename=resized.jpg');
            res.send(buffer);
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
    console.log('\n=== CONVERT PDF VERSION ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const targetVersion = req.body.version;
    
    if (!targetVersion) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            error: 'Parameter "version" is required',
            validVersions: ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0']
            // parameter version harus string, misal "1.4", bukan angka 1.4
        });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPdf = path.join(outputDir, `${baseName}-v${targetVersion}.pdf`);
    
    console.log('Target Version:', targetVersion);
    
    try {
        const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
        if (!validVersions.includes(targetVersion)) {
            throw new Error(`Invalid version. Valid: ${validVersions.join(', ')}`);
        }
        
        const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=${targetVersion} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputPdf}" "${inputPath}"`;
        
        console.log('Converting...');
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=converted-v${targetVersion}.pdf`);
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        [inputPath, outputPdf].forEach(file => {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) {}
        });
    }
});

// ============================================
// 2. COMPRESS PDF (dengan quality options)
// ============================================
app.post('/compress-pdf', upload.single('file'), async (req, res) => {
    console.log('\n=== COMPRESS PDF ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const quality = req.body.quality;
    
    if (!quality) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            error: 'Parameter "quality" is required',
            validQuality: ['screen', 'ebook', 'printer', 'prepress']
            // Parameter quality harus string, misal "screen", 
        });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPdf = path.join(outputDir, `${baseName}-compressed.pdf`);
    
    console.log('Quality:', quality);
    
    try {
        const qualitySettings = {
            'screen': '/screen',      // Smallest - 72 dpi
            'ebook': '/ebook',        // Medium - 150 dpi
            'printer': '/printer',    // High - 300 dpi
            'prepress': '/prepress'   // Highest - 300 dpi + color
        };
        
        if (!qualitySettings[quality]) {
            throw new Error(`Invalid quality. Valid: ${Object.keys(qualitySettings).join(', ')}`);
        }
        
        const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${qualitySettings[quality]} -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${outputPdf}" "${inputPath}"`;
        
        console.log('Compressing...');
        const startTime = Date.now();
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
        const duration = Date.now() - startTime;
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const inputStats = fs.statSync(inputPath);
        const outputStats = fs.statSync(outputPdf);
        const compressionRatio = ((1 - (outputStats.size / inputStats.size)) * 100).toFixed(2);
        
        console.log('Original:', (inputStats.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('Compressed:', (outputStats.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('Ratio:', compressionRatio, '%');
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=compressed-${quality}.pdf`);
        res.setHeader('X-Original-Size', inputStats.size.toString());
        res.setHeader('X-Compressed-Size', outputStats.size.toString());
        res.setHeader('X-Compression-Ratio', compressionRatio);
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        [inputPath, outputPdf].forEach(file => {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) {}
        });
    }
});

// ============================================
// 3. OPTIMIZE PDF (for web/fast loading)
// ============================================
app.post('/optimize-pdf', upload.single('file'), async (req, res) => {
    console.log('\n=== OPTIMIZE PDF ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPdf = path.join(outputDir, `${baseName}-optimized.pdf`);
    
    try {
        const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dNOPAUSE -dBATCH -dQUIET -dCompressFonts=true -dSubsetFonts=true -dEmbedAllFonts=true -dDetectDuplicateImages=true -dAutoRotatePages=/None -sOutputFile="${outputPdf}" "${inputPath}"`;
        
        console.log('Optimizing...');
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const inputStats = fs.statSync(inputPath);
        const outputStats = fs.statSync(outputPdf);
        
        console.log('Original:', (inputStats.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('Optimized:', (outputStats.size / 1024 / 1024).toFixed(2), 'MB');
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=optimized.pdf');
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        [inputPath, outputPdf].forEach(file => {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) {}
        });
    }
});

// ============================================
// 1. SPLIT PDF - Split by page ranges
// ============================================
app.post('/split-pdf', upload.single('file'), async (req, res) => {
    console.log('\n=== SPLIT PDF ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { pages } = req.body;
    
    if (!pages) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            error: 'Parameter "pages" is required',
            example: 'pages=1-3 or pages=1,3,5 or pages=1-3,5-7'
        });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPdf = path.join(outputDir, `${baseName}-split.pdf`);
    
    console.log('Pages to extract:', pages);
    
    try {
        // Menggunakan qpdf untuk split
        const command = `qpdf "${inputPath}" --pages "${inputPath}" ${pages} -- "${outputPdf}"`;
        
        console.log('Splitting PDF...');
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=split-pages-${pages}.pdf`);
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Split failed. Make sure qpdf is installed.',
            details: error.message 
        });
    } finally {
        [inputPath, outputPdf].forEach(file => {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) {}
        });
    }
});

// ============================================
// 2. SPLIT PDF - Split into individual pages
// ============================================
app.post('/split-pdf', upload.single('pdf'), async (req, res) => {
    console.log('\n=== SPLIT PDF INTO PAGES ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    try {
        // Menggunakan qpdf untuk split semua halaman
        const command = `qpdf "${inputPath}" --split-pages "${outputDir}/${baseName}-page-%d.pdf"`;
        
        console.log('Splitting into individual pages...');
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
        
        // Cari semua file hasil split
        const files = fs.readdirSync(outputDir).filter(f => 
            f.startsWith(`${baseName}-page-`) && f.endsWith('.pdf')
        );
        
        if (files.length === 0) {
            throw new Error('No output files created');
        }
        
        console.log(`Created ${files.length} files`);
        
        // Buat ZIP dari semua file
        const archiver = require('archiver');
        const zipPath = path.join(outputDir, `${baseName}-split.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
            const zipBuffer = fs.readFileSync(zipPath);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=${baseName}-split.zip`);
            res.send(zipBuffer);
            
            // Cleanup
            fs.unlinkSync(zipPath);
            files.forEach(f => fs.unlinkSync(path.join(outputDir, f)));
        });
        
        archive.on('error', (err) => {
            throw err;
        });
        
        archive.pipe(output);
        files.forEach(file => {
            archive.file(path.join(outputDir, file), { name: file });
        });
        archive.finalize();
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Split failed. Make sure qpdf is installed.',
            details: error.message 
        });
    } finally {
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}
    }
});

// ============================================
// 3. MERGE PDF - Using pdf-lib
// ============================================
app.post('/merge-pdf', upload.array('pdfFiles', 10), async (req, res) => {
    console.log('\n=== MERGE PDF ===');
    
    if (!req.files || req.files.length < 2) {
        // Cleanup uploaded files
        if (req.files) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) {}
            });
        }
        return res.status(400).json({ 
            error: 'At least 2 PDF files required',
            note: 'Use field name "pdfFiles" for multiple files'
        });
    }

    const outputDir = path.dirname(req.files[0].path);
    const outputPdf = path.join(outputDir, `merged-${Date.now()}.pdf`);
    
    console.log(`Merging ${req.files.length} files...`);
    
    try {
        // Menggunakan pdf-lib untuk merge
        const mergedPdf = await PDFDocument.create();
        
        for (const file of req.files) {
            console.log(`Processing: ${file.originalname}`);
            const pdfBytes = fs.readFileSync(file.path);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const mergedPdfBytes = await mergedPdf.save();
        fs.writeFileSync(outputPdf, mergedPdfBytes);
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Merge failed',
            details: error.message 
        });
    } finally {
        // Cleanup all uploaded files
        if (req.files) {
            req.files.forEach(file => {
                try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
            });
        }
        try { if (fs.existsSync(outputPdf)) fs.unlinkSync(outputPdf); } catch (e) {}
    }
});

// ============================================
// 4. MERGE PDF - Using qpdf (alternative, faster for large files)
// ============================================
app.post('/merge-pdf-qpdf', upload.array('pdfFiles', 10), async (req, res) => {
    console.log('\n=== MERGE PDF (QPDF) ===');
    
    if (!req.files || req.files.length < 2) {
        if (req.files) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) {}
            });
        }
        return res.status(400).json({ 
            error: 'At least 2 PDF files required',
            note: 'Use field name "pdfFiles" for multiple files'
        });
    }

    const outputDir = path.dirname(req.files[0].path);
    const outputPdf = path.join(outputDir, `merged-${Date.now()}.pdf`);
    
    console.log(`Merging ${req.files.length} files using qpdf...`);
    
    try {
        // Build qpdf command
        const inputFiles = req.files.map(f => `"${f.path}"`).join(' ');
        const command = `qpdf --empty --pages ${inputFiles} -- "${outputPdf}"`;
        
        console.log('Executing qpdf...');
        await execPromise(command, { maxBuffer: 20 * 1024 * 1024, timeout: 120000 });
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Merge failed. Make sure qpdf is installed.',
            details: error.message 
        });
    } finally {
        // Cleanup
        if (req.files) {
            req.files.forEach(file => {
                try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
            });
        }
        try { if (fs.existsSync(outputPdf)) fs.unlinkSync(outputPdf); } catch (e) {}
    }
});

// ============================================
// 5. ROTATE PDF PAGES
// ============================================
app.post('/rotate-pdf', upload.single('file'), async (req, res) => {
    console.log('\n=== ROTATE PDF ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { angle, pages } = req.body;
    
    if (!angle) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
            error: 'Parameter "angle" is required',
            validAngles: ['90', '180', '270'],
            example: 'angle=90&pages=1-3 (pages optional, default: all)'
        });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPdf = path.join(outputDir, `${baseName}-rotated.pdf`);
    
    console.log('Rotation angle:', angle);
    console.log('Pages:', pages || 'all');
    
    try {
        const validAngles = ['90', '180', '270'];
        if (!validAngles.includes(angle)) {
            throw new Error(`Invalid angle. Valid: ${validAngles.join(', ')}`);
        }
        
        // Menggunakan qpdf untuk rotate
        const pagesArg = pages ? `--pages "${inputPath}" ${pages} --` : '';
        const command = `qpdf "${inputPath}" --rotate=${angle}:${pages || '1-z'} "${outputPdf}"`;
        
        console.log('Rotating...');
        await execPromise(command, { maxBuffer: 10 * 1024 * 1024, timeout: 60000 });
        
        if (!fs.existsSync(outputPdf)) {
            throw new Error('Output PDF not created');
        }
        
        const pdfBuffer = fs.readFileSync(outputPdf);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=rotated-${angle}.pdf`);
        res.send(pdfBuffer);
        
        console.log('✓ Success');

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Rotation failed. Make sure qpdf is installed.',
            details: error.message 
        });
    } finally {
        [inputPath, outputPdf].forEach(file => {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch (e) {}
        });
    }
});

// ============================================
// 6. GET PDF INFO (page count, size, version)
// ============================================
app.post('/pdf-info', upload.single('file'), async (req, res) => {
    console.log('\n=== PDF INFO ===');
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    
    try {
        const pdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
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
        
        console.log('PDF Info:', info);
        res.json(info);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to read PDF info',
            details: error.message 
        });
    } finally {
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) {}
    }
});

// ============================================
// ADD SIGNATURE (Drag & Drop + Upload/Draw Support)
// ============================================
app.post('/add-signature', upload.fields([
  { name: 'file' },
  { name: 'signature' }
]), async (req, res) => {
  try {
    const pdfPath = req.files['file']?.[0]?.path;
    const signPath = req.files['signature']?.[0]?.path;
    const { x, y, page } = req.body;

    if (!pdfPath || !signPath) {
      return res.status(400).json({ error: 'Missing PDF or signature image.' });
    }

    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageIndex = Math.max(0, parseInt(page || '1', 10) - 1);
    const pdfPage = pdfDoc.getPages()[pageIndex];

    const signBytes = fs.readFileSync(signPath);
    const signatureImage = await pdfDoc.embedPng(signBytes);
    const sigWidth = 120;
    const sigHeight = 60;

    // posisi X & Y dikirim langsung dari frontend (koordinat klik)
    const posX = x ? parseFloat(x) : pdfPage.getWidth() - sigWidth - 50;
    const posY = y ? parseFloat(y) : 50;

    pdfPage.drawImage(signatureImage, {
      x: posX,
      y: posY,
      width: sigWidth,
      height: sigHeight
    });

    const signedPdfBytes = await pdfDoc.save();
    const outputPath = `uploads/signed_${Date.now()}.pdf`;
    fs.writeFileSync(outputPath, signedPdfBytes);

    res.download(outputPath, 'signed.pdf', () => {
      [pdfPath, signPath, outputPath].forEach(f => {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      });
    });
  } catch (error) {
    console.error('❌ Error adding signature:', error);
    res.status(500).json({ error: 'Failed to add signature.' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server jalan di http://127.0.0.1:${PORT}`);
});