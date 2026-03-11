import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, ChevronLeft, ChevronRight, Image as ImageIcon, PlayCircle, Eye } from 'lucide-react';
import { supabase, type Material } from '../lib/supabase';

// Helper component to render material
function MaterialViewer({ material }: { material: Material }) {
  if (material.type === 'video') {
    // Extract ID for embedding
    const match = material.url.match(/youtu\.be\/([^#&?]*)|watch\?v=([^#&?]*)|embed\/([^#&?]*)/);
    const videoId = match ? (match[1] || match[2] || match[3]) : null;
    
    if (!videoId) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-400">
          Invalid Video URL
        </div>
      );
    }
    
    return (
      <div className="w-full h-full bg-black relative shadow-2xl overflow-hidden aspect-video md:aspect-auto">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
          title={material.title || 'YouTube video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        ></iframe>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center p-4">
      <img 
        src={material.url} 
        alt={material.title || 'Lesson material image'} 
        className="max-w-full max-h-full object-contain drop-shadow-lg rounded-xl"
      />
    </div>
  );
}

export default function StudentView() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [lessonTitle, setLessonTitle] = useState(`Lesson for ${classCode}`);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLesson() {
      if (!classCode) return;
      setIsLoading(true);
      try {
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('code', classCode)
          .maybeSingle();
          
        if (lessonError) throw lessonError;
        
        if (isMounted) {
          if (!lessonData) {
            setLessonTitle('Lesson not found');
            setIsLoading(false);
            return;
          }

          setLessonTitle(lessonData.title);
          
          const { data: materialsData, error: materialsError } = await supabase
            .from('materials')
            .select('*')
            .eq('lesson_id', lessonData.id)
            .order('id', { ascending: true });
            
          if (materialsError) throw materialsError;
          if (materialsData && isMounted) {
            setMaterials(materialsData);
          }
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadLesson();
    return () => { isMounted = false; };
  }, [classCode]);

  const currentMaterial = materials[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = materials.length > 0 ? currentIndex === materials.length - 1 : true;

  const nextMaterial = () => {
    if (!isLast) setCurrentIndex(prev => prev + 1);
  };

  const prevMaterial = () => {
    if (!isFirst) setCurrentIndex(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center z-20">
        <h1 className="font-bold truncate text-lg">{lessonTitle}</h1>
        <button 
          onClick={() => navigate('/')}
          className="text-slate-200 hover:text-white transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-80 bg-slate-900 border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors mb-6 group gap-2"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Exit Lesson
          </button>
          <h2 className="text-2xl font-bold text-slate-50 font-serif leading-tight">{lessonTitle}</h2>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-900/40 text-cyan-300 uppercase tracking-wider">
            {classCode}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {materials.map((material, index) => (
            <button
              key={material.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${
                currentIndex === index 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${currentIndex === index ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                 {material.type === 'video' ? <PlayCircle size={18} /> : <ImageIcon size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{material.title}</p>
                <p className={`text-xs ${currentIndex === index ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Part {index + 1} of {materials.length}
                </p>
              </div>
              {currentIndex === index && <Eye size={16} className="text-indigo-200" />}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center bg-slate-900 relative max-h-screen overflow-hidden">
        
        {/* Viewer */}
        <div className="w-full flex-1 flex items-center justify-center p-0 md:p-8 overflow-hidden relative">
          <div className="w-full h-full max-w-6xl mx-auto rounded-none md:rounded-2xl overflow-hidden shadow-2xl flex relative bg-black">
             {isLoading ? (
               <div className="text-slate-500 m-auto flex flex-col items-center gap-4">
                 <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                 <p>Loading lesson materials...</p>
               </div>
             ) : lessonTitle === 'Lesson not found' ? (
               <div className="text-slate-500 m-auto flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                   <LogOut size={24} className="text-slate-500" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-200">Class Code Invalid</h2>
                 <p className="text-slate-400 text-center max-w-sm">
                   We couldn't find a lesson with the code "{classCode}". Please check the code and try again.
                 </p>
               </div>
             ) : currentMaterial ? (
               <MaterialViewer material={currentMaterial} />
             ) : (
               <div className="text-slate-500 m-auto flex flex-col items-center gap-2">
                 <ImageIcon size={48} className="opacity-20" />
                 <p>No materials available.</p>
               </div>
             )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="w-full bg-slate-900 border-t border-slate-800 p-4 md:p-6 flex items-center justify-between shadow-lg z-10 sticky bottom-0">
          <div className="hidden md:block w-1/3">
             {/* Spacer for centering */}
             <span className="text-slate-400 font-medium text-sm">
                Material {currentIndex + 1} of {materials.length}
             </span>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-center">
            <button 
              onClick={prevMaterial}
              disabled={isFirst}
              className="px-5 py-3 rounded-full flex items-center gap-2 font-medium transition-all
              disabled:opacity-40 disabled:cursor-not-allowed bg-slate-900 text-slate-700 hover:bg-slate-200 hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <div className="md:hidden text-slate-500 text-sm font-medium mx-2">
              {currentIndex + 1} / {materials.length}
            </div>
            <button 
              onClick={nextMaterial}
              disabled={isLast}
              className="px-5 py-3 rounded-full flex items-center gap-2 font-medium transition-all shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="hidden md:flex w-1/3 justify-end pointer-events-none">
            {/* Empty space for balance */}
          </div>
        </div>
        
      </main>
    </div>
  );
}
