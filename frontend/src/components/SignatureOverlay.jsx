import React, { useState, useEffect, useRef } from 'react';

function SignatureOverlay({ signaturePreviewUrl, initialPosition, containerRef, onPositionChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleSignatureDragStart = (e) => {
    e.stopPropagation();
    setIsDragging(true);

    const signatureEl = e.currentTarget;
    const rect = signatureEl.getBoundingClientRect();
    
    // Hitung offset dari kursor ke tengah gambar
    dragOffset.current = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    };
  };

  useEffect(() => {
    const handleSignatureDrag = (e) => {
      if (!isDragging || !containerRef.current) return;
      e.preventDefault();
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollContainer = document.getElementById('pdf-signature-container');

      const newX = e.clientX - containerRect.left - dragOffset.current.x;
      const newY = e.clientY - containerRect.top + (scrollContainer?.scrollTop || 0) - dragOffset.current.y;
      
      const percentX = (newX / containerRect.width) * 100;
      const percentY = (newY / containerRef.current.scrollHeight) * 100;

      onPositionChange({
        ...initialPosition,
        x: Math.max(0, Math.min(100, percentX)),
        y: Math.max(0, Math.min(100, percentY)),
      });
    };

    const handleSignatureDragEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleSignatureDrag);
      window.addEventListener('mouseup', handleSignatureDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleSignatureDrag);
      window.removeEventListener('mouseup', handleSignatureDragEnd);
    };
  }, [isDragging, onPositionChange, containerRef, initialPosition]);


  return (
    <div
      className="absolute pointer-events-auto cursor-move"
      style={{ 
        left: `${initialPosition.x}%`, 
        top: `${initialPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        // Cegah flicker saat drag
        userSelect: 'none', 
      }}
      onMouseDown={handleSignatureDragStart}
    >
      <div className="bg-white p-1 rounded shadow-lg border-2 border-blue-500">
        <img
          src={signaturePreviewUrl} 
          alt="Signature preview"
          className="opacity-90"
          style={{ 
            width: '150px',
            height: 'auto',
          }}
          // Penting untuk mencegah browser melakukan drag gambar default
          draggable={false} 
        />
      </div>
    </div>
  );
}

export default SignatureOverlay;