import React from 'react';
// Panel pengaturan dinamis sesuai jenis konversi + ringkasan tool

function ConversionSettings({
  darkMode,
  currentConversionType,
  pdfVersion, setPdfVersion,
  targetWidth, setTargetWidth,
  targetHeight, setTargetHeight,
  splitMode, setSplitMode,
  splitRangeStart, setSplitRangeStart,
  splitRangeEnd, setSplitRangeEnd,
  splitEvery, setSplitEvery,
  getConversionTitle,
  getConversionDescription,
}) {
  return (
    <div className={`rounded-2xl shadow-xl border sticky top-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-semibold text-white">Conversion Settings</h2>
      </div>
      <div className="p-6 space-y-5">
        {currentConversionType === 'resize-file' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-3">Width (points for PDF / pixels for image)</label>
              <input type="number" min="1" max="20000" value={targetWidth} onChange={(e) => setTargetWidth(parseInt(e.target.value) || 1)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Height (points for PDF / pixels for image)</label>
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Split Mode</label>
              <select value={splitMode} onChange={(e) => setSplitMode(e.target.value)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`}>
                <option value="all">Split into individual pages</option>
                <option value="range">Extract page range</option>
                <option value="every">Split every N pages</option>
              </select>
            </div>
            {splitMode === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Start Page</label>
                  <input type="number" min="1" value={splitRangeStart} onChange={(e) => setSplitRangeStart(parseInt(e.target.value) || 1)} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Page</label>
                  <input type="number" min="1" value={splitRangeEnd} onChange={(e) => setSplitRangeEnd(parseInt(e.target.value) || 1)} className={`w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
                </div>
              </div>
            )}
            {splitMode === 'every' && (
              <div>
                <label className="block text-sm font-medium mb-1">Split every</label>
                <input type="number" min="1" value={splitEvery} onChange={(e) => setSplitEvery(parseInt(e.target.value) || 1)} className={`w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`} />
                <p className="text-xs opacity-80 mt-1">e.g., 3 = pages 1-3, 4-6, 7-9, etc.</p>
              </div>
            )}
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
            Klik <b>Select Position on PDF</b>, lalu klik area pada PDF untuk memilih posisi tanda tangan. Atur halaman di field <b>Page</b> (1–100).
          </div>
        )}
      </div>
    </div>
  );
}

export default ConversionSettings;
