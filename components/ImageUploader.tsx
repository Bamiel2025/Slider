
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, label }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Type de fichier invalide. Veuillez importer une image.');
        setImagePreview(null);
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        onImageUpload(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col gap-4">
        <span className="font-semibold text-slate-700">{label}</span>
        <div 
          onClick={handleClick}
          className="relative w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center text-slate-500 hover:bg-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
        >
        {imagePreview ? (
            <img src={imagePreview} alt="Aperçu" className="w-full h-full object-contain rounded-lg" />
        ) : (
            <div className="text-center p-4">
                <UploadIcon />
                <p className="mt-2 font-semibold">Cliquez pour importer</p>
                <p className="text-sm">PNG, JPG, WEBP, etc.</p>
            </div>
        )}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
        />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ImageUploader;
