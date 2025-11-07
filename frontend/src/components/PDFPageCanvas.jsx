import React, { useRef, useEffect } from 'react';

function PDFPageCanvas({ page }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!page || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const viewport = page.getViewport({ scale: 1.5 });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
      canvasContext: context,
      viewport: viewport,
    });
    
  }, [page]);

  return <canvas ref={canvasRef} className="border-b border-gray-300 mx-auto block" />;
}

// Gunakan React.memo untuk mencegah re-render jika prop 'page' tidak berubah.
// Ini adalah kunci untuk performa.
export default React.memo(PDFPageCanvas);