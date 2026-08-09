import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Image as ImageIcon, Youtube, GripVertical, Trash2, FolderPlus, Folder, FileText 
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase, type Material } from '../lib/supabase';
import AddVideoModal from '../components/AddVideoModal';
import UploadImageModal from '../components/UploadImageModal';
import AddDocumentModal from '../components/AddDocumentModal';

interface Subfolder { id: string; lesson_id: string; title: string; }
interface LessonData { id: string; title: string; code: string; }

function SortableMaterialItem({ material, folders, onAssign, onDelete }: { material: Material, folders: Subfolder[], onAssign: (matId: string, folderId: string | null) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: material.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`bg-slate-900 rounded-2xl border ${isDragging ? 'border-indigo-500 shadow-xl scale-[1.02]' : 'border-slate-800 shadow-sm'} p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all group`}>
      <div className="flex items-center gap-4 w-full sm:w-auto flex-grow min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-slate-800 p-2 rounded-lg text-slate-500 hover:text-slate-300 active:cursor-grabbing transition-colors">
          <GripVertical size={20} />
        </div>
        
        <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative border border-slate-700/50">
          {material.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center"><Youtube size={16} /></div>
            </div>
          ) : material.type === 'document' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center"><FileText size={16} /></div>
            </div>
          ) : (
            <img src={material.url} alt={material.title || 'Image material'} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-grow min-w-0">
          <h4 className="font-semibold text-slate-50 line-clamp-1">{material.title || (material.type === 'image' ? 'Image File' : material.type === 'document' ? 'Document' : 'YouTube Video')}</h4>
          <p className="text-sm text-slate-400 capitalize flex items-center gap-1 mt-1">
            {material.type === 'image' ? <ImageIcon size={14}/> : material.type === 'document' ? <FileText size={14}/> : <Youtube size={14}/>} {material.type}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto pl-12 sm:pl-0 mt-2 sm:mt-0">
        <select 
          value={material.subfolder_id || ''} 
          onChange={(e) => onAssign(material.id, e.target.value || null)}
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none flex-grow sm:flex-grow-0 max-w-[150px] truncate"
        >
          <option value="">Main Material</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
        <button onClick={() => onDelete(material.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={20} /></button>
      </div>
    </div>
  );
}

export default function LessonEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dbLessonId = id || '';
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [initialMaterials, setInitialMaterials] = useState<Material[]>([]);
  const [folders, setFolders] = useState<Subfolder[]>([]);
  const [initialFolders, setInitialFolders] = useState<Subfolder[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!dbLessonId) return;
      try {
        setIsLoading(true);
        
        // Fetch dynamic lesson data (Title and Code)
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', dbLessonId)
          .single();
          
        if (lessonError) throw lessonError;
        if (isMounted && lessonData) setLesson(lessonData as LessonData);

        // Fetch materials and folders
        const [matsRes, foldersRes] = await Promise.all([
          supabase.from('materials').select('*').eq('lesson_id', dbLessonId).order('id', { ascending: true }),
          supabase.from('subfolders').select('*').eq('lesson_id', dbLessonId).order('created_at', { ascending: true })
        ]);
        
        if (matsRes.error) throw matsRes.error;
        if (foldersRes.error) throw foldersRes.error;
        
        if (isMounted) {
          // The || [] prevents undefined mapping crashes
          setMaterials((matsRes.data as Material[]) || []);
          setInitialMaterials((matsRes.data as Material[]) || []);
          setFolders((foldersRes.data as Subfolder[]) || []);
          setInitialFolders((foldersRes.data as Subfolder[]) || []);
        }
      } catch (err) { 
        console.error('Supabase fetch error:', err); 
      } finally { 
        if (isMounted) setIsLoading(false); 
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [dbLessonId]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMaterials((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddFolder = () => {
    const title = window.prompt("Enter new folder name:");
    if (!title || !title.trim()) return;
    setFolders([...folders, { id: crypto.randomUUID(), lesson_id: dbLessonId, title: title.trim() }]);
  };

  const handleAssignFolder = (materialId: string, folderId: string | null) => {
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, subfolder_id: folderId } : m));
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm("Delete this folder? Materials inside will be moved to Main Materials.")) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setMaterials(prev => prev.map(m => m.subfolder_id === folderId ? { ...m, subfolder_id: null } : m));
    }
  };

  const handleAddVideo = async (url: string, fallbackTitle: string) => {
    let finalTitle = fallbackTitle || 'YouTube Video';
    try {
      const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      if (data && data.title) finalTitle = data.title;
    } catch (error) { console.error("Failed to fetch title."); }
    setMaterials(prev => [...prev, { id: crypto.randomUUID(), lesson_id: dbLessonId, type: 'video', url, title: finalTitle, subfolder_id: null }]);
  };

  const handleAddImage = (url: string, title: string) => {
    setMaterials(prev => [...prev, { id: crypto.randomUUID(), lesson_id: dbLessonId, type: 'image', url, title, subfolder_id: null }]);
  };

  const handleAddDocument = (url: string, title: string) => {
    setMaterials(prev => [...prev, { id: crypto.randomUUID(), lesson_id: dbLessonId, type: 'document', url, title, subfolder_id: null }]);
  };

  const handleDeleteMaterial = (materialId: string) => { setMaterials(prev => prev.filter(m => m.id !== materialId)); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!dbLessonId) throw new Error("Missing lesson ID");

      const currentFolderIds = folders.map(f => f.id);
      const foldersToDelete = initialFolders.filter(f => !currentFolderIds.includes(f.id)).map(f => f.id);
      if (foldersToDelete.length > 0) await supabase.from('subfolders').delete().in('id', foldersToDelete);
      if (folders.length > 0) await supabase.from('subfolders').upsert(folders.map(f => ({ id: !f.id.includes('-') ? crypto.randomUUID() : f.id, lesson_id: dbLessonId, title: f.title })), { onConflict: 'id' });

      const currentMaterialIds = materials.map(m => m.id);
      const materialsToDelete = initialMaterials.filter(m => !currentMaterialIds.includes(m.id)).map(m => m.id);
      if (materialsToDelete.length > 0) await supabase.from('materials').delete().in('id', materialsToDelete);
      if (materials.length > 0) await supabase.from('materials').upsert(materials.map(m => ({ id: !m.id.includes('-') ? crypto.randomUUID() : m.id, lesson_id: dbLessonId, type: m.type, url: m.url, title: m.title, subfolder_id: m.subfolder_id || null })), { onConflict: 'id' });

      navigate('/dashboard');
    } catch (error) { alert('Failed to save changes.'); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft size={24} /></button>
            <div>
              {isLoading ? (
                <div className="h-6 w-48 bg-slate-800 rounded animate-pulse"></div>
              ) : (
                <h1 className="text-xl font-bold text-slate-50 line-clamp-1">{lesson?.title || 'Untitled Class'}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                {isLoading ? (
                  <div className="h-4 w-24 bg-slate-800 rounded animate-pulse"></div>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-blue-900/50 shadow-sm">
                    Code: {lesson?.code || '------'}
                  </span>
                )}
                <span className="text-xs text-slate-500">Organize your materials</span>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md disabled:opacity-70">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 pb-32">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-300"><Folder className="text-blue-400" size={20} /><span className="font-medium">Active Folders: {folders.length}</span></div>
          <button onClick={handleAddFolder} className="text-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"><FolderPlus size={16} /> New Folder</button>
        </div>
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {folders.map(f => (
              <div key={f.id} className="bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 group">
                <span className="text-sm text-slate-200">{f.title}</span>
                <button onClick={() => handleDeleteFolder(f.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={materials.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {materials.map((material) => <SortableMaterialItem key={material.id} material={material} folders={folders} onAssign={handleAssignFolder} onDelete={handleDeleteMaterial} />)}
            </SortableContext>
          </DndContext>
          {isLoading ? (
            <div className="py-16 flex justify-center items-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>
          ) : materials.length === 0 && (
            <div className="py-16 text-center bg-slate-900 rounded-3xl border-2 border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><Plus size={32} /></div>
              <h3 className="text-lg font-medium text-slate-50">Module Empty</h3>
            </div>
          )}
        </div>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none flex justify-center z-10">
        <div className="bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-800/60 pointer-events-auto flex gap-1 w-full max-w-xl">
          <button onClick={() => setIsImageModalOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-indigo-900/20 text-indigo-400 rounded-xl transition-colors"><ImageIcon size={22} /><span className="text-xs font-semibold">Image</span></button>
          <div className="w-px bg-slate-800 my-2"></div>
          <button onClick={() => setIsDocumentModalOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-amber-900/20 text-amber-400 rounded-xl transition-colors"><FileText size={22} /><span className="text-xs font-semibold">Document</span></button>
          <div className="w-px bg-slate-800 my-2"></div>
          <button onClick={() => setIsVideoModalOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-red-900/20 text-red-400 rounded-xl transition-colors"><Youtube size={22} /><span className="text-xs font-semibold">Video</span></button>
        </div>
      </div>

      <AddVideoModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} onAdd={(url, title) => handleAddVideo(url, title)} />
      <UploadImageModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} onUpload={handleAddImage} />
      <AddDocumentModal isOpen={isDocumentModalOpen} onClose={() => setIsDocumentModalOpen(false)} onAdd={handleAddDocument} />
    </div>
  );
}
