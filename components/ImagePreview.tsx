import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
  allowZoom?: boolean;
  thumbnailWidth?: number;
  thumbnailQuality?: number;
}

export const getTransformedImageUrl = (src: string, width = 800, quality = 70): string => {
  try {
    const url = new URL(src);
    const publicObjectMarker = '/storage/v1/object/public/';
    const markerIndex = url.pathname.indexOf(publicObjectMarker);

    if (markerIndex === -1) return src;

    const objectPath = url.pathname.slice(markerIndex + publicObjectMarker.length);
    url.pathname = `${url.pathname.slice(0, markerIndex)}/storage/v1/render/image/public/${objectPath}`;
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    url.searchParams.set('resize', 'contain');
    return url.toString();
  } catch {
    return src;
  }
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  src, 
  alt, 
  className = '', 
  thumbnailClassName = '',
  allowZoom = true,
  thumbnailWidth = 800,
  thumbnailQuality = 70
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState(() => getTransformedImageUrl(src, thumbnailWidth, thumbnailQuality));

  const openModal = (e: React.MouseEvent) => {
    if (!allowZoom) return;
    e.stopPropagation();
    setIsOpen(true);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  const handleThumbnailError = () => {
    if (thumbnailSrc !== src) setThumbnailSrc(src);
  };

  const preventImageSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div 
        onClick={openModal} 
        onContextMenu={preventImageSave}
        className={`relative overflow-hidden cursor-zoom-in ${className}`}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        <img 
            src={thumbnailSrc}
            alt={alt} 
            loading="lazy"
            draggable={false}
            onDragStart={preventImageSave}
            onContextMenu={preventImageSave}
            onError={handleThumbnailError}
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
            draggable={false}
            onDragStart={preventImageSave}
            onContextMenu={preventImageSave}
            className="max-h-screen max-w-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
          />
        </div>,
        document.body
      )}
    </>
  );
};
