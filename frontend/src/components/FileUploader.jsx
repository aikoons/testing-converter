import React from 'react';
// Area drag&drop + tombol pilih file + daftar file + tombol convert/progress

function FileUploader({
  darkMode,
  inputKey,
  fileInputRef,
  accept,
  onFileChange,
  onDrop,
  onDragOver,
  selectedFiles,
  onPreview,
  onRemove,
  clearAll,
  title = "Drag & Drop Files Here",
  cta = "Select Files",
  conversionTitle,
  isConverting = false,
  conversionProgress = 0,
  currentConversionType,
  onStartConvert,
  compact = false,
}) {
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
          <input key={inputKey} ref={fileInputRef} type="file" accept={accept} multiple={currentConversionType !== 'add-signature' && currentConversionType !== 'split-pdf'} onChange={onFileChange} className="hidden" id="file-upload"/>
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

export default FileUploader;
