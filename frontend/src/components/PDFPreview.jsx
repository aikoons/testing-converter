import React from 'react';

function PDFPreview({ fileUrl, signatureBlob, signaturePosition, setSignaturePosition }) {

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignaturePosition({ x, y, page: 1 }); // nanti kalau multi-page, sesuaikan
  };

  return (
    <div className="relative border rounded-lg overflow-hidden" onClick={handleClick}>
      <iframe
        src={fileUrl}
        title="PDF Preview"
        className="w-full h-[600px]"
      />
      {signatureBlob && (
        <img
          src={URL.createObjectURL(signatureBlob)}
          alt="Signature"
          className="absolute"
          style={{
            left: signaturePosition.x,
            top: signaturePosition.y,
            width: 120,
            height: 60,
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}

export default PDFPreview;
