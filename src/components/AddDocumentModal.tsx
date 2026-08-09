import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText } from 'lucide-react';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => void;
}

export default function AddDocumentModal({ isOpen, onClose, onAdd }: AddDocumentModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && title.trim()) {
      onAdd(url.trim(), title.trim());
      setUrl('');
      setTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors">
          <X size={24} />
        </button>
        
        <div className="w-12 h-12 bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
          <FileText className="text-amber-400" size={24} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-50 mb-2">Add Document</h2>
        <p className="text-slate-400 text-sm mb-6">Paste a link to your Google Drive PDF or shared document.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Document Title</label>
            <input 
              type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Physics Formula Sheet"
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Google Drive Link</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon size={18} className="text-slate-500" />
              </div>
              <input 
                type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-slate-600"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-amber-900/20 mt-2">
            Add Document
          </button>
        </form>
      </div>
    </div>
  );
}
