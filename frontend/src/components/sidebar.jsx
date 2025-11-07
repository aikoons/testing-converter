import React from 'react'; // Pastikan React diimpor

// === Kode SidebarContent DITEMPEL DI SINI ===
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
              setIsMenuOpen(false); // Pastikan setIsMenuOpen ada di props
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
                      setIsMenuOpen(false); // Pastikan setIsMenuOpen ada di props
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
// === AKHIR Kode SidebarContent ===


// --- Komponen Sidebar Utama ---
// Hapus prop 'SidebarContent' jika ada sebelumnya
function Sidebar({ darkMode, isMenuOpen, setIsMenuOpen, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories }) {
  return (
    <>
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {/* Sidebar Mobile */}
      <div className={`fixed z-50 top-16 left-0 w-72 h-[calc(100vh-4rem)] md:hidden
        transform transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        overflow-y-auto`}
      >
        {/* Panggil SidebarContent langsung */}
        <SidebarContent {...{ darkMode, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories, setIsMenuOpen }} />
      </div>
      {/* Sidebar Desktop */}
      <div className={`hidden md:block sticky top-16 z-10 w-72
        ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        overflow-y-auto h-[calc(100vh-4rem)]`}
      >
        {/* Panggil SidebarContent langsung */}
        <SidebarContent {...{ darkMode, currentConversionType, setCurrentConversionType, setActiveTab, sidebarCategories, setIsMenuOpen }} />
      </div>
    </>
  );
}

export default Sidebar; // Pastikan Sidebar diekspor sebagai default