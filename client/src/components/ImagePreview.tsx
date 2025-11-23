// file: client/src/components/ImagePreview.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImagePreview({ src, alt, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // Click background to close
    >
      {/* Close Button (Optional visual cue) */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
      >
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] outline-none"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
      >
        {!loaded && (
           <div className="absolute inset-0 flex items-center justify-center text-white">
              <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
           </div>
        )}
        <img 
          src={src} 
          alt={alt || 'Preview'} 
          className={`max-w-full max-h-[90vh] object-contain shadow-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>,
    document.body
  );
}