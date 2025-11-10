import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// --- Komponen: Navbar ---
function Navbar({ darkMode, setDarkMode, setActiveTab, setSelectedFiles, setConversionResults, setHistory, isMenuOpen, setIsMenuOpen }) {
  return (
    <nav className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white shadow-sm border-b border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`mr-2 px-3 py-2 rounded-lg md:hidden ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              aria-label="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">DocConverter</h1>
              <p className="text-xs opacity-75">File converter</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => {
                  setActiveTab('home');
                  setSelectedFiles([]);
                  setConversionResults([]);
                }}
                className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} font-medium transition-colors`}
              >
                Home
              </button>
              <button
                onClick={() => setHistory([])}
                className={`${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} font-medium transition-colors`}
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- Komponen: Sidebar ---
function SidebarContent({ darkMode, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories, setIsMenuOpen }) {
  return (
    <>
      <div className={`px-5 py-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Tools</h2>
            <p className="text-xs opacity-70">Pilih kategori konversi</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('home');
              setIsMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors md:hidden ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            ↩ Back
          </button>
        </div>
      </div>
      <div className="p-4 space-y-6">
        {sidebarCategories.map((cat) => (
          <div key={cat.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-2">
              {cat.title}
            </h3>
            <ul className="space-y-2">
              {cat.tools.map((tool) => (
                <li key={tool.type}>
                  <button
                    onClick={() => {
                      setCurrentConversionType(tool.type);
                      setActiveTab('upload');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
                    } ${
                      currentConversionType === tool.type
                        ? darkMode
                          ? 'bg-gray-700'
                          : 'bg-blue-100'
                        : ''
                    }`}
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function Sidebar({ darkMode, isMenuOpen, setIsMenuOpen, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories }) {
  return (
    <>
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <div className={`fixed z-50 top-16 left-0 w-72 h-[calc(100vh-4rem)] md:hidden
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        overflow-y-auto`}
      >
        <SidebarContent {...{ darkMode, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories, setIsMenuOpen }} />
      </div>
      <div className={`hidden md:block sticky top-16 z-10 w-72
        ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        overflow-y-auto h-[calc(100vh-4rem)]`}
      >
        <SidebarContent {...{ darkMode, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories, setIsMenuOpen }} />
      </div>
    </>
  );
}

// --- Komponen: SignatureInput [Efek Pulpen] ---
function SignatureInput({ onSignatureReady, darkMode = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState('draw');
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  // Ref untuk melacak posisi & kecepatan
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });
  const currentWidthRef = useRef(2); // Lebar kuas awal
  // Nilai untuk mengatur efek "pulpen"
  const MIN_WIDTH = 0.5; // Garis tertipis
  const MAX_WIDTH = 3.0; // Garis tertebal
  const SPEED_WEIGHT = 0.7; // Seberapa besar pengaruh kecepatan (makin tinggi, makin tipis saat cepat)
  const WIDTH_SMOOTHING = 0.5; // Seberapa halus transisi tebal/tipis (0.1 = kasar, 0.9 = sangat halus)
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Atur properti goresan di sini
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round'; // Ujung garis bulat
    ctx.lineJoin = 'round'; // Sambungan garis bulat
    clearCanvas();
  }, [darkMode, clearCanvas]);

  // Fungsi yang diperbaiki (startDrawing & draw)
  const startDrawing = (e) => {
    if (signatureType !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;

    // Catat posisi dan waktu mulai
    lastPosRef.current = { x, y, time: Date.now() };
    currentWidthRef.current = 2; // Reset lebar kuas
    // Mulai menggambar titik pertama
    ctx.lineWidth = currentWidthRef.current;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y); // Gambar titik kecil
    ctx.stroke();
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || signatureType !== 'draw') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    // 1. Dapatkan posisi kursor (sudah diskalakan)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;

    // 2. Dapatkan data goresan sebelumnya
    const lastPos = lastPosRef.current;
    const currentTime = Date.now();
    const timeDelta = currentTime - lastPos.time;

    // 3. Hitung Jarak dan Kecepatan
    const distance = Math.sqrt(Math.pow(x - lastPos.x, 2) + Math.pow(y - lastPos.y, 2));
    const speed = distance / (timeDelta || 1); // (hindari pembagian nol)

    // 4. Hitung lebar kuas baru berdasarkan kecepatan
    let newWidth = MAX_WIDTH - (speed * SPEED_WEIGHT);
    // Batasi lebar kuas antara MIN dan MAX
    newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));

    // 5. Haluskan transisi lebar kuas
    currentWidthRef.current = (currentWidthRef.current * WIDTH_SMOOTHING) + (newWidth * (1 - WIDTH_SMOOTHING));

    // 6. Terapkan lebar baru dan gambar SEGMENT garis ini
    ctx.lineWidth = currentWidthRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // 7. Simpan posisi & waktu saat ini untuk goresan berikutnya
    lastPosRef.current = { x, y, time: currentTime };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    clearCanvas();
    setUploadedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => { if (blob) onSignatureReady(blob); }, 'image/png');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setUploadedImage(reader.result); setSignatureType('upload'); };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (signatureType === 'upload' && uploadedImage) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        clearCanvas();
        const maxWidth = canvas.width * 0.95;
        const maxHeight = canvas.height * 0.95;
        let { width, height } = img;
        const aspectRatio = width / height;
        if (width > maxWidth) { width = maxWidth; height = width / aspectRatio; }
        if (height > maxHeight) { height = maxHeight; width = height * aspectRatio; }
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        ctx.drawImage(img, x, y, width, height);
      };
      img.src = uploadedImage;
    }
  }, [uploadedImage, signatureType, clearCanvas]);

  return (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className="text-lg font-semibold mb-3">Add Signature</h3>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => { setSignatureType('draw'); clearSignature(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureType === 'draw' ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
        >Draw Signature</button>
        <button
          onClick={() => { setSignatureType('upload'); fileInputRef.current?.click(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureType === 'upload' ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
        >Upload Image</button>
        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
      </div>
      <div className="mb-4">
        <canvas
          ref={canvasRef} width={400} height={120}
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          className={`border rounded-lg w-full max-w-full ${darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-white'} cursor-crosshair`}
        />
        {signatureType === 'draw' && (<p className="text-xs opacity-70 mt-1 text-center">Draw your signature with mouse or touch</p>)}
        {signatureType === 'upload' && !uploadedImage && (<p className="text-xs opacity-70 mt-1 text-center">Click 'Upload Image' to select a signature image.</p>)}
      </div>
      <div className="flex justify-between">
        <button onClick={clearSignature} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Clear</button>
        <button onClick={saveSignature} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700">Use Signature</button>
      </div>
    </div>
  );
}

// --- Komponen: FileUploader ---
function FileUploader({ darkMode, inputKey, fileInputRef, accept, onFileChange, onDrop, onDragOver, selectedFiles, onPreview, onRemove, clearAll, title = "Drag & Drop Files Here", cta = "Select Files", conversionTitle, isConverting = false, conversionProgress = 0, currentConversionType, onStartConvert, compact = false, showAddMore = false, onAddMore }) {
  const isSingleFileMode = ['add-signature', 'split-pdf'].includes(currentConversionType);
  
  return (
    <div>
      {!selectedFiles.length && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer group transition-all duration-300 ${darkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
          onDrop={onDrop} onDragOver={onDragOver}
        >
          <div className="mb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full group-hover:bg-blue-200 transition-colors duration-200 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <svg className="w-8 h-8 text-blue-600" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="text-lg mb-2 font-medium">{title}</p>
          {conversionTitle && <p className="opacity-80 mb-4">Supports {conversionTitle} conversion</p>}
          <input key={inputKey} ref={fileInputRef} type="file" accept={accept} multiple={!isSingleFileMode} onChange={onFileChange} className="hidden" id="file-upload"/>
          <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            {cta}
          </label>
          {selectedFiles.length > 0 && (
            <button onClick={clearAll} className="mt-3 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium">
              Clear All Files
            </button>
          )}
          {!compact && <p className="text-xs opacity-70 mt-4">Supports files up to 25MB each • Max 10 files</p>}
        </div>
      )}
      {selectedFiles.length > 0 && (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Selected Files ({selectedFiles.length})</h3>
              <span className="text-sm opacity-80">Total: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedFiles.map((fileObj, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow duration-200 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{fileObj.name}</p>
                    <p className="text-xs opacity-80">{(fileObj.size / 1024 / 1024).toFixed(1)} MB • {(fileObj.type || '').toUpperCase()}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button onClick={() => onPreview && onPreview(fileObj)} className={`${darkMode ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}>Preview</button>
                    <button onClick={() => onRemove && onRemove(index)} className={`${darkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'} px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            
            {showAddMore && !isConverting && (
              <div className="mt-4">
                <input key={`${inputKey}-add`} ref={fileInputRef} type="file" accept={accept} multiple={!isSingleFileMode} onChange={onFileChange} className="hidden" id="file-upload-add"/>
                <button
                  onClick={() => document.getElementById('file-upload-add').click()}
                  className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add More Files
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={onStartConvert}
              disabled={isConverting}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isConverting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Converting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start Conversion
                </>
              )}
            </button>
          </div>
          {isConverting && conversionProgress > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm opacity-80 mb-2">
                <span className="font-medium">Conversion Progress</span>
                <span className="font-medium">{Math.round(conversionProgress)}%</span>
              </div>
              <div className={`w-full rounded-full h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300" style={{ width: `${conversionProgress}%` }}></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Komponen: ResultList ---
function ResultList({ darkMode, conversionResults, onReset, getConversionIcon, getConversionTitle, getConversionDescription, setCurrentConversionType, setActiveTab, setConversionResults, }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Conversion Complete!</h3>
              <div className={`border rounded-xl p-4 mb-4 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Successfully converted {conversionResults.length} file(s)</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {conversionResults.map((result, index) => (
                <div key={index} className={`rounded-xl p-4 hover:shadow-md transition-shadow duration-200 ${darkMode ? 'border border-gray-700' : 'border border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 opacity-80 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">{result.convertedName}</span>
                      </div>
                      <div className="text-sm opacity-80 space-y-1">
                        <p>Original: {result.originalName}</p>
                        <p>Format: <span className="font-medium">{result.outputFormat.toUpperCase()}</span> • Size: {result.fileSize}</p>
                        <p>Completed: {result.timestamp}</p>
                      </div>
                    </div>
                    <a href={result.downloadUrl} download={result.convertedName} className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md">Download</a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button onClick={onReset} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Convert More Files
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className={`rounded-2xl shadow-xl border sticky top-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              'pdf-to-word','word-to-pdf','jpg-to-pdf','pdf-to-jpg','excel-to-pdf','resize-file','convert-pdf-version','merge-pdf','split-pdf','add-signature'
            ].map((type) => (
              <button
                key={type}
                onClick={() => { setCurrentConversionType(type); setActiveTab('upload'); setConversionResults([]); }}
                className={`w-full p-4 rounded-lg text-left transition-colors ${darkMode ? 'border border-gray-700 hover:bg-gray-700' : 'border border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center">
                  {getConversionIcon(type)}
                  <div className="ml-3">
                    <div className="font-medium">{getConversionTitle(type)}</div>
                    <div className="text-xs opacity-80">{getConversionDescription(type).split('.')[0]}.</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Komponen: ConversionSettings ---
function ConversionSettings({ 
  darkMode, currentConversionType, 
  pdfVersion, setPdfVersion, 
  targetWidth, setTargetWidth, 
  targetHeight, setTargetHeight, 
  splitPages, setSplitPages,
  getConversionTitle, getConversionDescription, pdfPages 
}) {
  return (
    <div className={`rounded-2xl shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-semibold text-white">Conversion Settings</h2>
      </div>
      <div className="p-6 space-y-5">
        {currentConversionType === 'resize-file' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-3">Width (pixels for image)</label>
              <input type="number" min="1" max="20000" value={targetWidth} onChange={(e) => setTargetWidth(parseInt(e.target.value) || 1)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Height (pixels for image)</label>
              <input type="number" min="1" max="20000" value={targetHeight} onChange={(e) => setTargetHeight(parseInt(e.target.value) || 1)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
            </div>
          </>
        )}
        {currentConversionType === 'convert-pdf-version' && (
          <div>
            <label className="block text-sm font-medium mb-3">Target PDF Version</label>
            <select value={pdfVersion} onChange={(e) => setPdfVersion(e.target.value)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`}>
              {['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'].map(v => (<option key={v} value={v}>PDF {v}</option>))}
            </select>
          </div>
        )}
        {currentConversionType === 'split-pdf' && (
          <div>
            <label className="block text-sm font-medium mb-3">
              Pages to Extract
            </label>
            <input 
              type="text" 
              value={splitPages} 
              onChange={(e) => setSplitPages(e.target.value)} 
              placeholder="e.g., 1-3, 5, 7-9"
              className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} 
            />
            <p className="text-xs opacity-70 mt-2">
              Format: <strong>1-3</strong> or <strong>1,3,5</strong> or <strong>1-3,5-7</strong>
            </p>
          </div>
        )}
        <div className={`border rounded-lg p-4 ${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="font-medium">{getConversionTitle(currentConversionType)}</span>
          </div>
          <div className="text-xs opacity-90">
            <p>{getConversionDescription(currentConversionType)}</p>
          </div>
        </div>
        {currentConversionType === 'add-signature' && (
          <div className={`${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-800'} mt-2 p-3 rounded-lg text-xs`}>
            Klik <b>Place Signature on PDF</b>, lalu klik area pada PDF untuk memilih posisi tanda tangan. Atur halaman di field <b>Page</b> (1–{pdfPages.length > 0 ? pdfPages.length : 'Max'}).
          </div>
        )}
      </div>
    </div>
  );
}

// --- Komponen: PDFPageCanvas (Untuk Performa) ---
const MemoizedPDFPageCanvas = React.memo(function PDFPageCanvas({ page, scale }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!page || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    page.render(renderContext);
  }, [page, scale]);
  return (
    <canvas 
      ref={canvasRef} 
      style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
    />
  );
});

// --- Komponen: SignatureOverlay (Untuk Performa) ---
function SignatureOverlay({ signaturePreviewUrl, initialPosition, onPositionChange, pageWrapperRef, pdfRenderScale = 1.5 }) {
  const [isDragging, setIsDragging] = useState(false);
  const sigRef = useRef(null);
  const startDrag = useCallback((e) => {
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !sigRef.current || !pageWrapperRef.current) return;
      e.preventDefault();
      const containerRect = pageWrapperRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      let newX = mouseX - containerRect.left;
      let newY = mouseY - containerRect.top;
      newX = Math.max(0, Math.min(newX, containerRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height));
      const percentX = (newX / containerRect.width) * 100;
      const percentY = (newY / containerRect.height) * 100;
      onPositionChange({ x: percentX, y: percentY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange, pageWrapperRef]);

  return (
    <div
      ref={sigRef}
      className="absolute pointer-events-auto cursor-move select-none flex items-center justify-center"
      style={{
        left: `${initialPosition.x}%`,
        top: `${initialPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        width: `${120 * pdfRenderScale}px`,
        height: `${50 * pdfRenderScale}px`,
        border: '2px dashed #007bff',
        borderRadius: '8px',
      }}
      onMouseDown={startDrag}
    >
      <img
        src={signaturePreviewUrl}
        alt="Signature preview"
        className="max-w-full max-h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

// ===================================================================================
// == KOMPONEN UTAMA APLIKASI (APP COMPONENT)
// ===================================================================================
function App() {
  // ======= STATE GLOBAL =======
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionResults, setConversionResults] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [currentConversionType, setCurrentConversionType] = useState('pdf-to-word');
  const fileInputRef = useRef(null);
  const [inputKey, setInputKey] = useState(Date.now());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // API
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Settings
  const [pdfVersion, setPdfVersion] = useState('1.4');
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [splitPages, setSplitPages] = useState("");

  // Signature settings
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50, page: 1 });
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // PDF viewer states for signature placement
  const [pdfPagesData, setPdfPagesData] = useState([]);
  const [pdfRenderScale, setPdfRenderScale] = useState(1.5);
  const pdfViewerContainerRef = useRef(null);
  const pageWrapperRefs = useRef([]);
  const canvasContainerRef = useRef(null);

  // Stable URL for signature preview
  const signaturePreviewUrl = useMemo(() => {
    if (signatureBlob) return URL.createObjectURL(signatureBlob);
    return null;
  }, [signatureBlob]);

  // Clean up signature preview URL
  useEffect(() => {
    return () => {
      if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
    };
  }, [signaturePreviewUrl]);

  // Load PDF for preview when file is selected and placing signature
  useEffect(() => {
    let pdfDoc = null;
    const loadPdf = async () => {
      if (selectedFiles.length > 0 && currentConversionType === 'add-signature' && isSelectingPosition) {
        setIsPdfLoading(true);
        setError('');
        try {
          if (typeof window.pdfjsLib === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            document.head.appendChild(script);
            await new Promise((resolve, reject) => {
              script.onload = resolve;
              script.onerror = reject;
            });
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
          const fileUrl = selectedFiles[0].previewUrl;
          const loadingTask = window.pdfjsLib.getDocument(fileUrl);
          pdfDoc = await loadingTask.promise;
          const pages = [];
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            pages.push(page);
          }
          setPdfPagesData(pages);
          pageWrapperRefs.current = pages.map((_, i) => pageWrapperRefs.current[i] || React.createRef());
          if (pdfViewerContainerRef.current && pages.length > 0) {
            const firstPage = pages[0];
            const viewport = firstPage.getViewport({ scale: 1 });
            const containerWidth = pdfViewerContainerRef.current.clientWidth;
            const newScale = (containerWidth * 0.95) / viewport.width;
            setPdfRenderScale(newScale);
          }
        } catch (error) {
          console.error('Error loading PDF for preview:', error);
          setError("Gagal memuat pratinjau PDF. Pastikan koneksi internet stabil.");
        } finally {
          setIsPdfLoading(false);
        }
      }
    };
    loadPdf();
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
      setPdfPagesData([]);
    };
  }, [selectedFiles, isSelectingPosition, currentConversionType]);

  // Clean up file preview URL
  useEffect(() => {
    return () => {
      if (previewFile && previewFile.previewUrl) {
        URL.revokeObjectURL(previewFile.previewUrl);
      }
    };
  }, [previewFile]);

  // Event listener for Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    selectedFiles.forEach(f => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl);
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSignatureBlob(null);
    setIsSelectingPosition(false);
    setPdfPagesData([]);
    setSignaturePosition({ x: 50, y: 50, page: 1 });
    setSplitPages("");
    setError('');
  }, [currentConversionType]);

  // ======= UTILITAS =======
  const getFileExtension = (filename) => filename.split('.').pop().toLowerCase();
  const getFileType = (file) => {
    const ext = getFileExtension(file.name);
    const mimeType = (file.type || '').toLowerCase();
    if (ext === 'pdf' || mimeType.includes('pdf')) return 'pdf';
    if (['doc', 'docx'].includes(ext) || mimeType.includes('word') || mimeType.includes('msword')) return 'word';
    if (['xlsx', 'xls'].includes(ext) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (['jpeg', 'jpg'].includes(ext) || mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
    if (ext === 'png' || mimeType.includes('png')) return 'png';
    return 'unknown';
  };

  const getInputAcceptType = () => {
    switch (currentConversionType) {
      case 'pdf-to-word': return '.pdf';
      case 'word-to-pdf': return '.doc,.docx';
      case 'jpg-to-pdf': return '.jpg,.jpeg';
      case 'png-to-jpg': return '.png';
      case 'pdf-to-jpg': return '.pdf';
      case 'excel-to-pdf': return '.xlsx,.xls';
      case 'resize-file': return '.jpg,.jpeg,.png';
      case 'convert-pdf-version': return '.pdf';
      case 'merge-pdf': return '.pdf';
      case 'split-pdf': return '.pdf';
      case 'add-signature': return '.pdf';
      default: return '.pdf';
    }
  };

  // ======= HANDLER FILE =======
  const handleFileChange = (event) => {
    try {
      const files = Array.from(event.target.files || []);
      if (selectedFiles.length + files.length > 10) {
        setError('Maksimal 10 file per konversi.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      const validFiles = files.filter(file => {
        const fileType = getFileType(file);
        let valid = false;
        switch (currentConversionType) {
          case 'pdf-to-word': case 'pdf-to-jpg': case 'convert-pdf-version': case 'merge-pdf': case 'split-pdf': case 'add-signature':
            valid = fileType === 'pdf'; break;
          case 'word-to-pdf': valid = fileType === 'word'; break;
          case 'excel-to-pdf': valid = fileType === 'excel'; break;
          case 'jpg-to-pdf': valid = fileType === 'jpeg'; break;
          case 'png-to-jpg': valid = fileType === 'png'; break;
          case 'resize-file': valid = ['jpeg', 'png'].includes(fileType); break;
          default: valid = fileType === 'pdf';
        }
        if (!valid) {
          setError(`File ${file.name} tidak didukung untuk konversi ini.`);
          setTimeout(() => setError(''), 3000);
          return false;
        }
        if (file.size > 25 * 1024 * 1024) {
          setError(`File ${file.name} terlalu besar! Maksimal 25MB.`);
          setTimeout(() => setError(''), 3000);
          return false;
        }
        return true;
      });
      if (validFiles.length > 0) {
        if (['add-signature', 'split-pdf'].includes(currentConversionType)) {
            const newFile = { file: validFiles[0], name: validFiles[0].name, size: validFiles[0].size, type: validFiles[0].type, previewUrl: URL.createObjectURL(validFiles[0]) };
            setSelectedFiles([newFile]);
        } else {
            const filesWithPreview = validFiles.map(file => ({ file, name: file.name, size: file.size, type: file.type, previewUrl: URL.createObjectURL(file) }));
            setSelectedFiles(prev => [...prev, ...filesWithPreview]);
        }
        setInputKey(Date.now());
      }
    } catch (err) {
      console.error('File change error:', err);
      setError('Gagal memproses file. Silakan coba lagi.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    handleFileChange({ target: { files } });
  };

  const handleDragOver = (event) => event.preventDefault();

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const fileToRemove = prev[index];
      if (fileToRemove && fileToRemove.previewUrl) URL.revokeObjectURL(fileToRemove.previewUrl);
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setError('');
      return updated;
    });
  };

  const handlePreview = (fileObj) => { setPreviewFile(fileObj); setShowPreview(true); };
  const closePreview = () => { setShowPreview(false); setPreviewFile(null); };

  // ======= PANGGILAN SERVER =======
  const convertFile = async (fileObj, signaturePayload = null) => {
    const formData = new FormData();
    let endpoint = '';

    formData.append('file', fileObj.file);
    if (currentConversionType === 'add-signature' && signaturePayload) {
        formData.append('x', signaturePayload.x.toString());
        formData.append('y', signaturePayload.y.toString());
        formData.append('page', signaturePayload.page.toString());
        formData.append('signature', signatureBlob, 'signature.png');
        endpoint = '/add-signature';
    } else {
      switch (currentConversionType) {
        case 'pdf-to-word': endpoint = '/convert-pdf-to-word'; break;
        case 'word-to-pdf': endpoint = '/convert-word-to-pdf'; break;
        case 'jpg-to-pdf': endpoint = '/convert-jpg-to-pdf'; break;
        case 'pdf-to-jpg': endpoint = '/convert-pdf-to-jpg'; break;
        case 'png-to-jpg': endpoint = '/convert-png-to-jpg'; break;
        case 'excel-to-pdf': endpoint = '/convert-excel-to-pdf'; break;
        case 'resize-file':
          formData.append('width', targetWidth.toString());
          formData.append('height', targetHeight.toString());
          endpoint = '/resize-jpg'; break;
        case 'convert-pdf-version':
          formData.append('version', pdfVersion);
          endpoint = '/convert-pdf-version'; break;
        case 'merge-pdf': throw new Error('merge-pdf should be handled in bulk');
        default: throw new Error('Unsupported conversion type');
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Conversion failed: ${errorText}`);
    }
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    let convertedName, outputFormatUsed;
    switch (currentConversionType) {
      case 'pdf-to-word': convertedName = fileObj.name.replace(/\.pdf$/i, '.docx'); outputFormatUsed = 'docx'; break;
      case 'word-to-pdf': convertedName = fileObj.name.replace(/\.(doc|docx)$/i, '.pdf'); outputFormatUsed = 'pdf'; break;
      case 'jpg-to-pdf': convertedName = fileObj.name.replace(/\.(jpeg|jpg)$/i, '.pdf'); outputFormatUsed = 'pdf'; break;
      case 'pdf-to-jpg': convertedName = fileObj.name.replace(/\.pdf$/i, '.jpg'); outputFormatUsed = 'jpg'; break;
      case 'png-to-jpg': convertedName = fileObj.name.replace(/\.png$/i, '.jpg'); outputFormatUsed = 'jpg'; break;
      case 'excel-to-pdf': convertedName = fileObj.name.replace(/\.(xlsx|xls)$/i, '.pdf'); outputFormatUsed = 'pdf'; break;
      case 'resize-file':
        convertedName = fileObj.name.replace(/\.(jpe?g|png)$/i, '_resized.jpg');
        outputFormatUsed = 'jpg';
        break;
      case 'convert-pdf-version': convertedName = fileObj.name.replace(/\.pdf$/i, `_v${pdfVersion}.pdf`); outputFormatUsed = 'pdf'; break;
      case 'add-signature': convertedName = fileObj.name.replace(/\.pdf$/i, '_signed.pdf'); outputFormatUsed = 'pdf'; break;
      default:
        convertedName = fileObj.name;
        outputFormatUsed = getFileExtension(fileObj.name);
    }
    return {
      originalName: fileObj.name, convertedName, outputFormat: outputFormatUsed,
      fileSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toLocaleString(), downloadUrl
    };
  };

  const mergePdfFiles = async () => {
    const formData = new FormData();
    selectedFiles.forEach((fileObj) => formData.append('pdfFiles', fileObj.file));
    const response = await fetch(`${API_BASE_URL}/merge-pdf`, { method: 'POST', body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Merge failed: ${errorText}`);
    }
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const convertedName = 'merged.pdf';
    return {
      originalName: 'Multiple PDFs',
      convertedName,
      outputFormat: 'pdf',
      fileSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toLocaleString(),
      downloadUrl
    };
  };

  const splitPdfFile = async () => {
    if (selectedFiles.length === 0) throw new Error('No file selected');
    if (!splitPages) {
      throw new Error('Parameter "pages" is required. Please enter page ranges.');
    }
    const fileObj = selectedFiles[0];
    const formData = new FormData();
    formData.append('file', fileObj.file);
    formData.append('pages', splitPages);
    const response = await fetch(`${API_BASE_URL}/split-pdf`, { method: 'POST', body: formData });
    if (!response.ok) {
      try {
        const errorJson = await response.json();
        throw new Error(errorJson.error || `Split failed: ${response.statusText}`);
      } catch(e) {
        const errorText = await response.text();
        throw new Error(`Split failed: ${errorText || e.message}`);
      }
    }
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    let convertedName, outputFormatUsed;
    if (blob.type.includes('zip')) {
      convertedName = fileObj.name.replace(/\.pdf$/i, '_split.zip');
      outputFormatUsed = 'zip';
    } else {
      convertedName = fileObj.name.replace(/\.pdf$/i, '_split.pdf');
      outputFormatUsed = 'pdf';
    }
    return {
      originalName: fileObj.name,
      convertedName,
      outputFormat: outputFormatUsed,
      fileSize: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      timestamp: new Date().toLocaleString(),
      downloadUrl
    };
  };

  // ======= HELPER UI =======
  const getConversionIcon = (type) => {
      const iconClass = darkMode ? 'text-white' : 'text-blue-600';
      const bgClass = darkMode ? 'bg-blue-900' : 'bg-blue-100';
      const yellowBg = darkMode ? 'bg-yellow-900' : 'bg-yellow-100';
      const yellowText = darkMode ? 'text-yellow-300' : 'text-yellow-600';
      const greenBg = darkMode ? 'bg-green-900' : 'bg-green-100';
      const greenText = darkMode ? 'text-green-300' : 'text-green-600';
      const purpleBg = darkMode ? 'bg-purple-900' : 'bg-purple-100';
      const purpleText = darkMode ? 'text-purple-300' : 'text-purple-600';
      const iconMap = {
        'pdf-to-word': { bg: bgClass, icon: (<svg className={`w-6 h-6 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>) },
        'word-to-pdf': { bg: bgClass, icon: (<svg className={`w-6 h-6 ${iconClass}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>) },
        'jpg-to-pdf': { bg: yellowBg, icon: (<svg className={`w-6 h-6 ${yellowText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
        'png-to-jpg': { bg: yellowBg, icon: (<svg className={`w-6 h-6 ${yellowText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
        'pdf-to-jpg': { bg: yellowBg, icon: (<svg className={`w-6 h-6 ${yellowText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>) },
        'excel-to-pdf': { bg: greenBg, icon: (<svg className={`w-6 h-6 ${greenText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>) },
        'merge-pdf': { bg: bgClass, icon: (<svg className={`w-6 h-6 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>) },
        'split-pdf': { bg: bgClass, icon: (<svg className={`w-6 h-6 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>) },
        'add-signature': { bg: bgClass, icon: (<svg className={`w-6 h-6 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>) }
      };
      const defIcon = { bg: purpleBg, icon: (<svg className={`w-6 h-6 ${purpleText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>) };
      const { bg, icon } = iconMap[type] || defIcon;
      return (<div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>);
    };

  const getConversionTitle = (type) => ({
      'pdf-to-word': 'PDF to Word',
      'word-to-pdf': 'Word to PDF',
      'jpg-to-pdf': 'JPG to PDF',
      'png-to-jpg': 'PNG to JPG',
      'pdf-to-jpg': 'PDF to JPG',
      'excel-to-pdf': 'Excel to PDF',
      'resize-file': 'Resize File',
      'convert-pdf-version': 'Convert PDF Version',
      'merge-pdf': 'Merge PDFs',
      'split-pdf': 'Split PDF',
      'add-signature': 'Add Signature'
    }[type] || 'Convert Documents');

  const getConversionDescription = (type) => ({
      'pdf-to-word': 'Easily convert your PDF files into easy to edit DOC and DOCX documents.',
      'word-to-pdf': 'Make DOC and DOCX files easy to read by converting them to PDF.',
      'jpg-to-pdf': 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
      'png-to-jpg': 'Convert PNG images to JPG format. Reduce file size while maintaining quality.',
      'pdf-to-jpg': 'Convert each PDF page into a JPG image or extract all images contained in a PDF.',
      'excel-to-pdf': 'Convert Excel spreadsheets to PDF for easy sharing and printing.',
      'resize-file': 'Resize JPG or PNG files to custom dimensions.',
      'convert-pdf-version': 'Convert PDF to different versions (1.0 to 2.0) for compatibility.',
      'merge-pdf': 'Combine multiple PDF files into a single document in the order uploaded.',
      'split-pdf': 'Split a PDF into individual pages or custom page ranges.',
      'add-signature': 'Add your handwritten or uploaded signature to a PDF document with transparent background.'
    }[type] || 'Convert between various document formats with ease.');

  const sidebarCategories = [
      { title: 'PDF Tools', tools: [
        { type: 'pdf-to-word', name: 'PDF to Word' },
        { type: 'convert-pdf-version', name: 'Convert PDF Version' },
        { type: 'merge-pdf', name: 'Merge PDFs' },
        { type: 'split-pdf', name: 'Split PDF' },
        { type: 'add-signature', name: 'Add Signature' },
      ]},
      { title: 'Office Tools', tools: [
        { type: 'word-to-pdf', name: 'Word to PDF' },
        { type: 'excel-to-pdf', name: 'Excel to PDF' },
      ]},
      { title: 'Picture Tools', tools: [
        { type: 'jpg-to-pdf', name: 'JPG to PDF' },
        { type: 'png-to-jpg', name: 'PNG to JPG' },
        { type: 'pdf-to-jpg', name: 'PDF to JPG' },
        { type: 'resize-file', name: 'Resize File' },
      ]}
    ];

  // ======= SIGNATURE PLACEMENT LOGIC =======
  const handlePdfClickForSignature = useCallback((e) => {
    if (!isSelectingPosition || !signatureBlob || pdfPagesData.length === 0) return;
    const targetWrapper = e.target.closest('.page-wrapper');
    if (!targetWrapper) return;
    const pageIndex = parseInt(targetWrapper.dataset.pageNumber, 10) - 1;
    if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= pdfPagesData.length) return;
    const rect = targetWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    setSignaturePosition({ page: pageIndex + 1, x: percentX, y: percentY });
  }, [isSelectingPosition, signatureBlob, pdfPagesData]);

  const handleSignatureDragOnPage = useCallback((pageNumber, newPosition) => {
    setSignaturePosition({ page: pageNumber, x: newPosition.x, y: newPosition.y });
  }, []);

  // ======= CONVERSION FLOW =======
  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select a file first.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (currentConversionType === 'add-signature') {
      if (!signatureBlob) { setError('Please create or upload a signature first.'); setTimeout(() => setError(''), 3000); return; }
      if (!isSelectingPosition) { setError('Please click "Place Signature on PDF" before converting.'); setTimeout(() => setError(''), 3000); return; }
    }
    setIsConverting(true); setConversionProgress(0); setConversionResults([]); setError('');
    try {
      let results = [];
      if (currentConversionType === 'merge-pdf') {
          try { const result = await mergePdfFiles(); results = [result]; setHistory(prev => [result, ...prev.slice(0, 19)]); }
          catch (err) { console.error('Merge error:', err); setError(`Merge failed: ${err.message}`); }
      } else if (currentConversionType === 'split-pdf') {
        if (!splitPages) {
          setError('Please enter the page range to split (e.g., "1-3, 5").');
          setTimeout(() => setError(''), 3000);
          setIsConverting(false);
          return;
        }
        const interval = setInterval(() => setConversionProgress(prev => prev >= 95 ? (clearInterval(interval), 95) : prev + 1), 50);
        try { 
          const result = await splitPdfFile(); 
          clearInterval(interval); 
          setConversionProgress(100); 
          results = [result]; 
          setHistory(prev => [result, ...prev.slice(0, 19)]); 
        }
        catch (err) { 
          clearInterval(interval); 
          console.error('Split error:', err); 
          setError(`Split failed: ${err.message}`); 
        }
      } else if (currentConversionType === 'add-signature') {
        const interval = setInterval(() => setConversionProgress(prev => prev >= 95 ? 95 : prev + 1), 50);
        const fileObj = selectedFiles[0];
        const signaturePayload = { 
            x: signaturePosition.x, 
            y: signaturePosition.y,
            page: signaturePosition.page,
        };
        try { 
            const result = await convertFile(fileObj, signaturePayload); 
            clearInterval(interval); 
            setConversionProgress(100); 
            results = [result]; 
            setHistory(prev => [result, ...prev.slice(0, 19)]); 
        }
        catch (err) { clearInterval(interval); console.error('Signature error:', err); setError(`Failed to add signature: ${err.message}`); }
      } else { 
        for (let i = 0; i < selectedFiles.length; i++) {
          setConversionProgress(((i + 0.5) / selectedFiles.length) * 100);
          try { const result = await convertFile(selectedFiles[i]); results.push(result); setHistory(prev => [result, ...prev.slice(0, 19)]); }
          catch (err) { console.error('Conversion error:', err); setError(`Failed to convert ${selectedFiles[i].name}: ${err.message}`); }
          setConversionProgress(((i + 1) / selectedFiles.length) * 100);
        }
      }
      if (results.length > 0) {
        setConversionResults(results); 
        setActiveTab('results'); 
      } else if (!error) { 
        setError('All conversions failed. Please try again.'); setTimeout(() => setError(''), 4000);
      }
    } catch (err) {
      setError(`Terjadi kesalahan saat konversi: ${err.message}`); console.error(err);
    } finally {
      setIsConverting(false); setTimeout(() => setConversionProgress(0), 1000);
    }
  };

  const handleReset = () => {
    selectedFiles.forEach(f => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    if(activeTab === 'results') {
        conversionResults.forEach(r => { if (r.downloadUrl) URL.revokeObjectURL(r.downloadUrl); });
        setConversionResults([]); 
    }
    setSelectedFiles([]); 
    setIsConverting(false); 
    setConversionProgress(0);
    setActiveTab('home'); 
    setCurrentConversionType('pdf-to-word'); 
    setInputKey(Date.now()); 
    setError('');
    setSignatureBlob(null); 
    setIsSelectingPosition(false); 
    setSignaturePosition({ x: 50, y: 50, page: 1 });
    setSplitPages("");
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    setSelectedFiles([]);
    setConversionResults([]);
    setError('');
    setSignatureBlob(null);
    setIsSelectingPosition(false);
    setPdfPagesData([]);
    setSignaturePosition({ x: 50, y: 50, page: 1 });
    setSplitPages("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Fungsi baru untuk ganti PDF di Add Signature ---
  const handleChangePdfForSignature = () => {
    if (selectedFiles.length > 0 && selectedFiles[0].previewUrl) {
      URL.revokeObjectURL(selectedFiles[0].previewUrl);
    }
    setSelectedFiles([]);
    setSignatureBlob(null);
    setIsSelectingPosition(false);
    setPdfPagesData([]);
    setSignaturePosition({ x: 50, y: 50, page: 1 });
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setInputKey(Date.now());
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ======= RENDER KOMPONEN UTAMA =======
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-slate-50 to-slate-100 text-gray-900'} select-none`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} setActiveTab={setActiveTab} setSelectedFiles={setSelectedFiles} setConversionResults={setConversionResults} setHistory={setHistory} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <div className="relative flex">
        <Sidebar darkMode={darkMode} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} currentConversionType={currentConversionType} setCurrentConversionType={setCurrentConversionType} setActiveTab={setActiveTab} sidebarCategories={sidebarCategories} />
        <div className="flex-1">
          {error && <div className="fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg bg-red-100 text-red-800 max-w-md">{error}</div>}
          {showPreview && previewFile && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className={`rounded-2xl max-w-4xl w-full max-h-screen overflow-hidden shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className="text-xl font-semibold">Document Preview</h3>
                    <button onClick={closePreview} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-auto max-h-[70vh]">
                    {(() => {
                      if (!previewFile) return null;
                      const fileType = getFileType(previewFile);
                      if (fileType === 'pdf') {
                        return (<embed src={previewFile.previewUrl} type="application/pdf" className="w-full h-96" />);
                      } else if (['jpeg', 'png'].includes(fileType)) {
                        return (<img src={previewFile.previewUrl} alt={previewFile.name} className="max-h-96 mx-auto object-contain" />);
                      }
                      return (<div className="text-center py-8"><p className="text-gray-500">Preview not available for this file type.</p></div>);
                    })()}
                  </div>
                </div>
              </div>
          )}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">{activeTab === 'home' ? 'Document Converter' : getConversionTitle(currentConversionType)}</h1>
              <p className="text-lg opacity-90 max-w-3xl mx-auto">{activeTab === 'home' ? 'Convert PDF, Word, and image formats with tools' : getConversionDescription(currentConversionType)}</p>
              
              {/* Back button for all conversion pages */}
              {activeTab !== 'home' && (
                <button
                  onClick={handleBackToHome}
                  className="mt-4 inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </button>
              )}
            </div>
            
            {activeTab === 'home' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { type: 'pdf-to-word', title: 'PDF to Word', desc: 'Convert PDF to editable Word documents.' }, 
                    { type: 'word-to-pdf', title: 'Word to PDF', desc: 'Convert Word documents to PDF format.' }, 
                    { type: 'jpg-to-pdf', title: 'JPG to PDF', desc: 'Convert JPG images to PDF documents.' }, 
                    { type: 'png-to-jpg', title: 'PNG to JPG', desc: 'Convert PNG images to JPG format.' }, 
                    { type: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Extract images from PDF as JPG files.' }, 
                    { type: 'excel-to-pdf', title: 'Excel to PDF', desc: 'Convert Excel spreadsheets to PDF.' }, 
                    { type: 'resize-file', title: 'Resize File', desc: 'Resize JPG/PNG to custom dimensions.' },
                    { type: 'convert-pdf-version', title: 'PDF Version', desc: 'Convert PDF version for compatibility.' }, 
                    { type: 'merge-pdf', title: 'Merge PDFs', desc: 'Combine multiple PDFs into one file.' }, 
                    { type: 'split-pdf', title: 'Split PDF', desc: 'Split PDF into pages or ranges.' }, 
                    { type: 'add-signature', title: 'Add Signature', desc: 'Add your signature to a PDF document.' }
                  ].map((item) => (
                    <div key={item.type} className={`rounded-xl shadow-md border p-6 cursor-pointer hover:shadow-lg transition-shadow duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={() => { setCurrentConversionType(item.type); setActiveTab('upload'); }}>
                      {getConversionIcon(item.type)}
                      <h3 className="text-lg font-semibold mt-4 mb-2">{item.title}</h3>
                      <p className="text-sm opacity-80">{item.desc}</p>
                    </div>
                  ))}
                </div>
            )}
            
            {activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {currentConversionType === 'add-signature' ? (
                  <div className="lg:col-span-2">
                    <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                      <div className="p-6">
                        <h2 className="text-2xl font-bold mb-2">Add Signature to PDF</h2>
                        <p className="text-lg opacity-80 mb-6">Draw or upload your signature and add it to your PDF document.</p>
                        {selectedFiles.length === 0 ? (
                            <FileUploader darkMode={darkMode} inputKey={inputKey} fileInputRef={fileInputRef} accept=".pdf" onFileChange={handleFileChange} onDrop={handleDrop} onDragOver={handleDragOver} selectedFiles={selectedFiles} clearAll={handleReset} compact title="Upload PDF File" cta="Select PDF" />
                        ) : (
                          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                            <p className="font-medium">Selected PDF: {selectedFiles[0]?.name}</p>
                            <button onClick={handleChangePdfForSignature} className="mt-2 text-sm text-red-600 hover:text-red-800">Change PDF</button>
                          </div>
                        )}
                        {selectedFiles.length > 0 && !signatureBlob && (
                          <SignatureInput onSignatureReady={(blob) => setSignatureBlob(blob)} darkMode={darkMode} />
                        )}
                        {signatureBlob && (
                          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                              <h3 className="font-medium mb-2">Signature Ready</h3>
                              <div className="flex items-center gap-4 flex-wrap">
                                {signaturePreviewUrl && (
                                  <div className="p-2 rounded-md" style={{ background: 'repeating-conic-gradient(#eee 0% 25%, transparent 0% 50%) 0 / 20px 20px' }}>
                                    <img src={signaturePreviewUrl} alt="Signature preview" className="max-h-20 inline-block" />
                                  </div>
                                )}
                                <div className="flex gap-3">
                                  <button onClick={() => setSignatureBlob(null)} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Edit Signature</button>
                                  <button onClick={() => setIsSelectingPosition(v => !v)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                    {isSelectingPosition ? 'Hide PDF Preview' : 'Place Signature on PDF'}
                                  </button>
                                </div>
                              </div>
                              {isSelectingPosition && (
                                <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <label htmlFor="page-number" className="block text-sm font-medium">Page</label>
                                      <input
                                        type="number"
                                        id="page-number"
                                        value={signaturePosition.page}
                                        onChange={(e) => {
                                          const page = parseInt(e.target.value) || 1;
                                          setSignaturePosition(prev => ({ ...prev, page: Math.max(1, Math.min(page, pdfPagesData.length)) }));
                                        }}
                                        min="1"
                                        max={pdfPagesData.length > 0 ? pdfPagesData.length : 1}
                                        className={`mt-1 w-20 p-2 rounded-lg text-center ${darkMode ? 'bg-gray-700 border-gray-600' : 'border border-gray-300'}`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm">
                                        <span className="font-medium">Position:</span> X={signaturePosition.x.toFixed(1)}%, Y={signaturePosition.y.toFixed(1)}%
                                      </p>
                                      <p className="text-xs opacity-70 mt-1">Click on the PDF preview or drag the signature to set its position.</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {isSelectingPosition && (
                                <div ref={pdfViewerContainerRef} className="mt-4 border rounded-lg overflow-hidden">
                                  <div className={`${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-800'} text-center py-2 text-sm font-medium`}>
                                    📄 PDF Preview - Klik atau seret tanda tangan untuk mengatur posisi
                                  </div>
                                  <div id="pdf-signature-container" className="relative w-full overflow-y-auto bg-gray-200" style={{ height: '600px' }}>
                                    {isPdfLoading ? (
                                      <div className="flex items-center justify-center h-full">
                                        <p className="text-lg font-medium text-gray-500">Memuat Pratinjau PDF...</p>
                                      </div>
                                    ) : pdfPagesData.length > 0 ? (
                                      <div ref={canvasContainerRef}>
                                        {pdfPagesData.map((page, index) => (
                                          <div 
                                            key={`page-wrapper-${index}`}
                                            ref={pageWrapperRefs.current[index]}
                                            className="relative page-wrapper"
                                            data-page-number={index + 1}
                                            onClick={handlePdfClickForSignature}
                                          >
                                              <MemoizedPDFPageCanvas page={page} scale={pdfRenderScale} />
                                              {signaturePreviewUrl && signaturePosition.page === (index + 1) && (
                                                  <SignatureOverlay 
                                                      signaturePreviewUrl={signaturePreviewUrl}
                                                      initialPosition={{ x: signaturePosition.x, y: signaturePosition.y }}
                                                      onPositionChange={(newPos) => handleSignatureDragOnPage(index + 1, newPos)}
                                                      pageWrapperRef={pageWrapperRefs.current[index]}
                                                      pdfRenderScale={pdfRenderScale}
                                                  />
                                              )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center h-full">
                                        <p className="text-lg font-medium text-red-500">{error || "Gagal memuat pratinjau PDF."}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                        )}
                        <div className="flex justify-center space-x-4 pt-6">
                            {selectedFiles.length > 0 && (
                              <button
                                onClick={handleConvert}
                                disabled={isConverting || (currentConversionType === 'add-signature' && (!signatureBlob || !isSelectingPosition))}
                                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                              >
                                {isConverting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding Signature...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Add Signature to PDF
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2">
                      <div className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="p-6">
                          <FileUploader
                            darkMode={darkMode}
                            inputKey={inputKey}
                            fileInputRef={fileInputRef}
                            accept={getInputAcceptType()}
                            onFileChange={handleFileChange}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            selectedFiles={selectedFiles}
                            onPreview={handlePreview}
                            onRemove={removeFile}
                            clearAll={handleReset}
                            title="Drag & Drop Files Here"
                            cta="Select Files"
                            conversionTitle={getConversionTitle(currentConversionType)}
                            isConverting={isConverting}
                            conversionProgress={conversionProgress}
                            currentConversionType={currentConversionType}
                            onStartConvert={handleConvert}
                            showAddMore={!['add-signature', 'split-pdf'].includes(currentConversionType)}
                          />
                        </div>
                      </div>
                  </div>
                )}
                
                <div className="lg:col-span-1">
                  <div className="sticky top-8 space-y-6">
                    <ConversionSettings 
                      darkMode={darkMode} 
                      currentConversionType={currentConversionType} 
                      pdfVersion={pdfVersion} 
                      setPdfVersion={setPdfVersion} 
                      targetWidth={targetWidth} 
                      setTargetWidth={setTargetWidth} 
                      targetHeight={targetHeight} 
                      setTargetHeight={setTargetHeight} 
                      splitPages={splitPages}
                      setSplitPages={setSplitPages}
                      getConversionTitle={getConversionTitle} 
                      getConversionDescription={getConversionDescription} 
                      pdfPages={pdfPagesData} 
                    />
                    {history.length > 0 && (
                      <div className={`rounded-2xl shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-2xl">
                          <h2 className="text-xl font-semibold text-white">Conversion History</h2>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto">
                          <div className="space-y-3">
                            {history.slice(0, 10).map((item, index) => (
                              <div key={index} className={`text-sm pb-2 last:border-0 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                                <p className="font-medium">{item.convertedName}</p>
                                <p className="text-xs opacity-80">{item.timestamp}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'results' && conversionResults.length > 0 && <ResultList darkMode={darkMode} conversionResults={conversionResults} onReset={handleReset} getConversionIcon={getConversionIcon} getConversionTitle={getConversionTitle} getConversionDescription={getConversionDescription} setCurrentConversionType={setCurrentConversionType} setActiveTab={setActiveTab} setConversionResults={setConversionResults} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
