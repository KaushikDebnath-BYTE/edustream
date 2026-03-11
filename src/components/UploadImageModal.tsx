import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UploadImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string, title: string) => void;
}

export default function UploadImageModal({ isOpen, onClose, onUpload }: UploadImageModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // 1. Generate a unique filename to prevent overwriting
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // 2. Upload to Supabase Storage bucket named 'lesson-materials'
      const { error: uploadError } = await supabase.storage
        .from('lesson-materials')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 3. Get the public URL for the uploaded file
      const { data } = supabase.storage
        .from('lesson-materials')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // 4. Pass the permanent public URL back to the parent
      onUpload(publicUrl, file.name);
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <ImageIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-serif">Upload Image</h2>
            <p className="text-slate-500 text-sm">PNG, JPG, up to 10MB</p>
          </div>
        </div>

        <div 
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
            ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileSelect} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp"
          />
          
          <div className="flex flex-col items-center gap-4">
            {isUploading ? (
               <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400">
                <UploadCloud size={32} />
              </div>
            )}
            <div>
              <p className="font-medium text-slate-700 text-lg">
                {isUploading ? 'Uploading...' : 'Click or drag image to upload'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
