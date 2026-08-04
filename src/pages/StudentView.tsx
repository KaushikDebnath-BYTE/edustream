import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Folder, FileText, Video, Image as ImageIcon, Link as LinkIcon, LogOut, Loader2, Play } from 'lucide-react';

interface Lesson { id: string; title: string; code: string; }
interface Subfolder { id: string; title: string; }
interface Material { id: string; subfolder_id?: string | null; title: string; type: string; url: string; }

// Helper function to extract YouTube ID
const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function StudentView() {
  const navigate = useNavigate();
  const [lessonCode, setLessonCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchLessonData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonCode.trim()) return;
    
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('code', lessonCode.toUpperCase().trim())
        .single();
      
      if (lessonError || !lessonData) throw new Error("Lesson not found. Please check your code.");
      setLesson(lessonData);

      const { data: foldersData } = await supabase.from('subfolders').select('*').eq('lesson_id', lessonData.id).order('created_at', { ascending: true });
      const { data: materialsData } = await supabase.from('materials').select('*').eq('lesson_id', lessonData.id);
      
      if (foldersData) setSubfolders(foldersData);
      if (materialsData) setMaterials(materialsData);
      
    } catch (error: any) {
      setErrorMsg(error.message);
      setLesson(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={18} className="text-blue-400" />;
      case 'image': return <ImageIcon size={18} className="text-emerald-400" />;
      case 'document': return <FileText size={18} className="text-amber-400" />;
      default: return <LinkIcon size={18} className="text-slate-400" />;
    }
  };

  const renderMaterialList = (mats: Material[]) => {
    if (mats.length === 0) return <p className="text-slate-500 text-sm italic py-4 text-center border border-dashed border-slate-800 rounded-lg mt-2">No materials available.</p>;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
        {mats.map(material => {
          const ytId = material.type === 'video' ? getYouTubeId(material.url) : null;

          // Rich YouTube Card
          if (ytId) {
            return (
              <a key={material.id} href={material.url} target="_blank" rel="noopener noreferrer" className="flex flex-col overflow-hidden bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all group shadow-sm hover:shadow-blue-900/20">
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-600/90 text-white p-3 rounded-full shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all backdrop-blur-sm">
                      <Play size={20} className="fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-slate-200 group-hover:text-blue-400 transition-colors font-semibold block line-clamp-2 text-sm">{material.title}</span>
                  <span className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Video size={12}/> Video Lesson</span>
                </div>
              </a>
            );
          }

          // Standard Document/Link Card
          return (
            <a key={material.id} href={material.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all group shadow-sm hover:shadow-blue-900/20">
              <div className="p-2.5 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                {renderIcon(material.type)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-slate-200 group-hover:text-blue-400 transition-colors font-semibold block truncate text-sm">{material.title}</span>
                <span className="text-slate-500 text-xs capitalize mt-0.5 block">{material.type}</span>
              </div>
            </a>
          );
        })}
      </div>
    );
  };

  const rootMaterials = materials.filter(m => !m.subfolder_id);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-slate-50">Student Portal</h1>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Search Box */}
        {!lesson && (
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl max-w-md mx-auto text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">Join a Lesson</h2>
            <p className="text-slate-400 text-sm mb-6">Enter the 6-letter lesson code provided by your teacher.</p>
            
            <form onSubmit={fetchLessonData} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-500" />
                </div>
                <input
                  type="text" required value={lessonCode} onChange={(e) => setLessonCode(e.target.value)}
                  placeholder="e.g. RNPP5R"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-3 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:normal-case"
                />
              </div>
              {errorMsg && <p className="text-red-400 text-sm text-left">{errorMsg}</p>}
              <button disabled={isLoading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Access Materials'}
              </button>
            </form>
          </div>
        )}

        {/* Read-Only Lesson View */}
        {lesson && (
          <div className="space-y-8 transform animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/40 text-blue-400 shadow-sm mb-2">
                  Code: {lesson.code}
                </div>
                <h2 className="text-3xl font-bold text-slate-50">{lesson.title}</h2>
              </div>
              <button onClick={() => setLesson(null)} className="text-sm text-slate-400 hover:text-slate-200 underline">View another lesson</button>
            </div>

            {/* Root Materials */}
            {rootMaterials.length > 0 && (
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-200">Main Materials</h3>
                {renderMaterialList(rootMaterials)}
              </div>
            )}

            {/* Subfolders */}
            {subfolders.map(folder => {
              const folderMaterials = materials.filter(m => m.subfolder_id === folder.id);
              return (
                <div key={folder.id} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-50"></div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-100">
                    <Folder className="text-blue-400 fill-blue-400/20" size={20} />
                    {folder.title}
                  </h3>
                  <div className="mt-2">
                    {renderMaterialList(folderMaterials)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
