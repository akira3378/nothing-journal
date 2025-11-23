import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
  allowZoom?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  src, 
  alt, 
  className = '', 
  thumbnailClassName = '',
  allowZoom = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (e: React.MouseEvent) => {
    if (!allowZoom) return;
    e.stopPropagation();
    setIsOpen(true);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <div 
        onClick={openModal} 
        className={`relative overflow-hidden cursor-zoom-in ${className}`}
      >
        <img 
            src={src} 
            alt={alt} 
            loading="lazy"
            className={`transition-transform duration-500 hover:scale-105 ${thumbnailClassName}`} 
        />
      </div>

      {isOpen && allowZoom && createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={closeModal}
        >
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-50 bg-black/50 rounded-full"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img 
            src={src} 
            alt={alt} 
            className="max-h-screen max-w-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>,
        document.body
      )}
    </>
  );
};