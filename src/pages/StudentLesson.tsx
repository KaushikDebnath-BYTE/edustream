import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Folder, FileText, Video, Link as LinkIcon, X, ExternalLink } from 'lucide-react';

export default function StudentLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    if (!id) return;
    const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
    setLesson(lessonData);
    const { data: folderData } = await supabase.from('subfolders').select('*').eq('lesson_id', id).order('created_at');
    const { data: materialData } = await supabase.from('materials').select('*').eq('lesson_id', id).order('created_at');
    if (folderData) setFolders(folderData);
    if (materialData) setMaterials(materialData);
    setIsLoading(false);
  };

  const getIcon = (type: string) => {
    if (type === 'video') return <Video className="text-purple-400" size={20} />;
    if (type === 'link') return <LinkIcon className="text-emerald-400" size={20} />;
    return <FileText className="text-blue-400" size={20} />;
  };

  const renderLightboxContent = () => {
    if (!activeMaterial) return null;
    let embedUrl = activeMaterial.url;
    
    // YouTube URL Conversion to Embed format
    if (activeMaterial.type === 'video') {
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
        const ampersandIndex = embedUrl.indexOf('&');
        if (ampersandIndex !== -1) embedUrl = embedUrl.substring(0, ampersandIndex);
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
      }
      return <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>;
    }
    
    if (activeMaterial.type === 'image' || embedUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return <img src={embedUrl} alt={activeMaterial.title} className="w-full h-full object-contain" />;
    }

    // Fallback for PDFs and other links
    return <iframe src={embedUrl} className="absolute inset-0 w-full h-full bg-white"></iframe>;
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-50">{lesson?.title || 'Lesson Materials'}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {folders.length === 0 && materials.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Your teacher hasn't added any materials to this lesson yet.</div>
        ) : (
          <>
            {materials.filter(m => !m.folder_id).length > 0 && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="bg-slate-800/80 px-6 py-4 flex items-center gap-3 border-b border-slate-700">
                  <FileText className="text-blue-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-100">Main Materials</h2>
                </div>
                <div className="p-4 space-y-2">
                  {materials.filter(m => !m.folder_id).map(material => (
                    <button 
                      key={material.id} 
                      onClick={() => setActiveMaterial(material)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group text-left"
                    >
                      <div className="p-2 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                        {getIcon(material.type)}
                      </div>
                      <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{material.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {folders.map(folder => (
              <div key={folder.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="bg-slate-800/50 px-6 py-4 flex items-center gap-3 border-b border-slate-800">
                  <Folder className="text-blue-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-100">{folder.title}</h2>
                </div>
                <div className="p-4 space-y-2">
                  {materials.filter(m => m.folder_id === folder.id).map(material => (
                    <button 
                      key={material.id} 
                      onClick={() => setActiveMaterial(material)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group text-left"
                    >
                      <div className="p-2 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                        {getIcon(material.type)}
                      </div>
                      <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{material.title}</span>
                    </button>
                  ))}
                  {materials.filter(m => m.folder_id === folder.id).length === 0 && (
                    <p className="text-slate-500 text-sm px-4 py-2 italic">No materials in this folder.</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {/* The Holodeck Lightbox */}
      {activeMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-6xl aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col">
            
            {/* Lightbox Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-white truncate pr-4">{activeMaterial.title}</h3>
              <div className="flex items-center gap-4 shrink-0">
                <a 
                  href={activeMaterial.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg"
                >
                  Open Original <ExternalLink size={16} />
                </a>
                <button 
                  onClick={() => setActiveMaterial(null)} 
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div className="flex-1 bg-black relative">
              {renderLightboxContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
