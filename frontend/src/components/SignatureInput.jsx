import React, { useEffect, useRef, useState } from 'react';
// Menggambar/Upload tanda tangan pada canvas, mengembalikan Blob via onSignatureReady

function SignatureInput({ onSignatureReady, darkMode = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState('draw');
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = darkMode ? '#e5e7eb' : '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [darkMode]);

  const startDrawing = (e) => {
    if (signatureType !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || signatureType !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
  };

  const saveSignature = () => {
    if (signatureType === 'upload' && uploadedImage) {
      fetch(uploadedImage).then(r => r.blob()).then(blob => onSignatureReady(blob));
      return;
    }
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
    if (!uploadedImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const maxWidth = 300;
      const maxHeight = 100;
      let { width, height } = img;
      if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
      if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      ctx.drawImage(img, x, y, width, height);
    };
    img.src = uploadedImage;
  }, [uploadedImage]);

  return (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
      <h3 className="text-lg font-semibold mb-3">Add Signature</h3>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => { setSignatureType('draw'); setUploadedImage(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureType === 'draw' ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
        >Draw Signature</button>
        <button
          onClick={() => { setSignatureType('upload'); setUploadedImage(null); fileInputRef.current?.click(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signatureType === 'upload' ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')}`}
        >Upload Image</button>
        <input type="file" ref={fileInputRef} accept="image/png,image/jpeg" onChange={handleImageUpload} className="hidden" />
      </div>
      <div className="mb-4">
        <canvas
          ref={canvasRef} width={400} height={120}
          onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          onTouchStart={(e) => { e.preventDefault(); const t = e.touches[0]; const me = new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }); canvasRef.current.dispatchEvent(me); }}
          onTouchMove={(e) => { e.preventDefault(); const t = e.touches[0]; const me = new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }); canvasRef.current.dispatchEvent(me); }}
          onTouchEnd={(e) => { e.preventDefault(); const me = new MouseEvent('mouseup', {}); canvasRef.current.dispatchEvent(me); }}
          className={`border rounded-lg w-full max-w-full ${darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-white'} cursor-crosshair`}
        />
        {signatureType === 'draw' && (<p className="text-xs opacity-70 mt-1 text-center">Draw your signature with mouse or touch</p>)}
      </div>
      <div className="flex justify-between">
        <button onClick={clearSignature} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>Clear</button>
        <button onClick={saveSignature} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700">Use Signature</button>
      </div>
    </div>
  );
}

export default SignatureInput;
