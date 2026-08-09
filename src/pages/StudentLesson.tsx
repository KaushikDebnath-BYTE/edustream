import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Folder, FileText, Video, Link as LinkIcon } from 'lucide-react';

export default function StudentLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    if (!id) return;
    
    // Fetch Lesson Details
    const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
    setLesson(lessonData);

    // Fetch Folders & Materials
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
          folders.map(folder => (
            <div key={folder.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-800/50 px-6 py-4 flex items-center gap-3 border-b border-slate-800">
                <Folder className="text-blue-400" size={20} />
                <h2 className="text-lg font-semibold text-slate-100">{folder.title}</h2>
              </div>
              <div className="p-4 space-y-2">
                {materials.filter(m => m.folder_id === folder.id).map(material => (
                  <a 
                    key={material.id} 
                    href={material.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group"
                  >
                    <div className="p-2 bg-slate-950 rounded-lg group-hover:scale-110 transition-transform">
                      {getIcon(material.type)}
                    </div>
                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors">{material.title}</span>
                  </a>
                ))}
                {materials.filter(m => m.folder_id === folder.id).length === 0 && (
                  <p className="text-slate-500 text-sm px-4 py-2 italic">No materials in this folder.</p>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
