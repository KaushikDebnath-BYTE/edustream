import React, { useState } from 'react';
import { X, Youtube, Link as LinkIcon } from 'lucide-react';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string, thumbnailUrl: string) => void;
}

export default function AddVideoModal({ isOpen, onClose, onAdd }: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYoutubeId(url);
    
    if (videoId) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      onAdd(url, `YouTube Video (${videoId})`, thumbnailUrl);
      setUrl('');
      setError('');
      onClose();
    } else {
      setError('Please enter a valid YouTube URL');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-900/40 text-red-400 rounded-xl flex items-center justify-center">
            <Youtube size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50 font-serif">Add Video</h2>
            <p className="text-slate-400 text-sm">Paste a YouTube link below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">YouTube URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={18} className="text-slate-500" />
              </div>
              <input 
                type="url" 
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-md shadow-red-900/20 flex items-center justify-center gap-2"
          >
            Add Video
          </button>
        </form>
      </div>
    </div>
  );
}
