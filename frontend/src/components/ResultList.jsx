import React from 'react';
// Daftar hasil konversi + tombol download + Quick Actions

function ResultList({
  darkMode,
  conversionResults,
  onReset,
  getConversionIcon,
  getConversionTitle,
  getConversionDescription,
  setCurrentConversionType,
  setActiveTab,
  setConversionResults,
}) {
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
              'pdf-to-word','word-to-pdf','jpg-to-pdf','pdf-to-jpg','excel-to-pdf','resize-file','convert-pdf-version','merge-pdfs','split-pdf','add-signature'
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

export default ResultList;
