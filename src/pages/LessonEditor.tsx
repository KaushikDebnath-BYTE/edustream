import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Image as ImageIcon, Youtube, GripVertical, Trash2 
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase, type Material } from '../lib/supabase';
import AddVideoModal from '../components/AddVideoModal';
import UploadImageModal from '../components/UploadImageModal';

// Sortable Item Component
function SortableMaterialItem({ material, onDelete }: { material: Material, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: material.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-slate-900 rounded-2xl border ${isDragging ? 'border-indigo-500 shadow-xl scale-[1.02]' : 'border-slate-800 shadow-sm'} p-4 flex items-center gap-4 transition-all group`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab hover:bg-slate-800 p-2 rounded-lg text-slate-500 hover:text-slate-300 active:cursor-grabbing transition-colors"
      >
        <GripVertical size={20} />
      </div>
      
      <div className="w-32 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative border border-slate-700/50">
        {material.type === 'video' ? (
           <>
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
                <Youtube size={16} />
              </div>
            </div>
           </>
        ) : (
          <img src={material.url} alt={material.title || 'Image material'} className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-slate-50 line-clamp-1">{material.title || (material.type === 'image' ? 'Image File' : 'YouTube Video')}</h4>
        <p className="text-sm text-slate-400 capitalize flex items-center gap-1 mt-1">
          {material.type === 'image' ? <ImageIcon size={14}/> : <Youtube size={14}/>} {material.type}
        </p>
      </div>

      <button 
        onClick={() => onDelete(material.id)}
        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remove material"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}

export default function LessonEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map simple frontend IDs to actual database UUIDs
  // Since you're using '1' in the URL, we need a valid UUID for the database
  const LESSION_ID_MAP: Record<string, string> = {
    '1': '00000000-0000-0000-0000-000000000001',
    // add more if needed
  };

  const dbLessonId = id ? (LESSION_ID_MAP[id] || id) : '';
  
  // Stub metadata
  const lessonTitle = "Introduction to Cell Biology";
  const code = "BIO-101";

  const [materials, setMaterials] = useState<Material[]>([]);
  const [initialMaterials, setInitialMaterials] = useState<Material[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('lesson_id', dbLessonId)
          .order('id', { ascending: true });

        if (error) throw error;

        if (isMounted && data) {
          setMaterials(data as Material[]);
          setInitialMaterials(data as Material[]);
        }
      } catch (err) {
        console.log('Supabase fetch error (Check RLS policies):', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (dbLessonId) {
      fetchMaterials();
    }

    return () => {
      isMounted = false;
    };
  }, [dbLessonId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddVideo = (url: string, title: string) => {
    const newMaterial: Material = {
      id: crypto.randomUUID(), // Use real UUIDs for new items
      lesson_id: dbLessonId || crypto.randomUUID(),
      type: 'video',
      url: url,
      title,
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleAddImage = (url: string, title: string) => {
    const newMaterial: Material = {
      id: crypto.randomUUID(), // Use real UUIDs for new items
      lesson_id: dbLessonId || crypto.randomUUID(),
      type: 'image',
      url: url,
      title,
    };
    setMaterials([...materials, newMaterial]);
  };

  const handleDelete = (materialId: string) => {
    setMaterials(materials.filter(m => m.id !== materialId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Starting save request for materials:', materials);

    try {
      if (!dbLessonId) throw new Error("Missing lesson ID");

      // 0. Ensure the lesson itself exists first to satisfy FK constraint
      const { data: existingLesson, error: lessonCheckError } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', dbLessonId)
        .single();
        
      if (lessonCheckError && lessonCheckError.code !== 'PGRST116') {
        throw lessonCheckError; // throw if it's not a "Not found" error
      }

      // If the lesson didn't exist, we must create it now before adding materials
      if (!existingLesson) {
        // Find current user id or use a fallback for now
        const { data: userData } = await supabase.auth.getUser();
        
        const { error: insertLessonError } = await supabase
          .from('lessons')
          .insert({
            id: dbLessonId,
            title: lessonTitle,
            code: code,
            teacher_id: userData.user?.id || '00000000-0000-0000-0000-000000000000'
          });

        if (insertLessonError) throw insertLessonError;
      }

      // 1. Identify which materials have been deleted since the initial load
      const currentMaterialIds = materials.map((m) => m.id);
      const materialsToDelete = initialMaterials
        .filter((initialMaterial) => !currentMaterialIds.includes(initialMaterial.id))
        .map((m) => m.id);

      if (materialsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('materials')
          .delete()
          .in('id', materialsToDelete);

        if (deleteError) throw deleteError;
      }

      // 2. Upsert existing and new materials using their consistent UUIDs
      let savedMaterials: Material[] = [];
      if (materials.length > 0) {
        const payload = materials.map((m) => {
          // If the ID is an older temporary one (e.g., from Math.random()), give it a valid UUID now.
          // Valid UUIDs have dashes in them, whereas Math.random() generates ids like '0.1234...'
          const isTempId = !m.id.includes('-');
          return {
            id: isTempId ? crypto.randomUUID() : m.id,
            lesson_id: dbLessonId, // strictly enforce correct lesson association
            type: m.type,
            url: m.url,
            title: m.title
          };
        });

        const { data: upsertData, error: upsertError } = await supabase
          .from('materials')
          .upsert(payload, { onConflict: 'id' })
          .select();

        if (upsertError) throw upsertError;
        
        if (upsertData) {
          savedMaterials = upsertData as Material[];
        }
      }

      // 3. Sync frontend state with the successful save state
      setMaterials(savedMaterials.length > 0 ? savedMaterials : materials);
      setInitialMaterials(savedMaterials.length > 0 ? savedMaterials : materials);

      console.log('Save request completed successfully.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during save request:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-50 line-clamp-1">{lessonTitle}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">Code: {code}</span>
                <span className="text-xs text-slate-500">Drag items to reorder</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm font-medium rounded-xl transition-colors shadow-md disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 pb-32">
        {/* Materials List */}
        <div className="space-y-4">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={materials.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {materials.map((material) => (
                <SortableMaterialItem 
                  key={material.id} 
                  material={material} 
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {isLoading ? (
            <div className="py-16 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-500 font-medium">Loading materials...</span>
            </div>
          ) : materials.length === 0 && (
            <div className="py-16 text-center bg-slate-900 rounded-3xl border-2 border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-50">Module Empty</h3>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">Add images or YouTube videos below to build your lesson.</p>
            </div>
          )}
        </div>

      </main>

      {/* Action Bar (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none flex justify-center z-10">
        <div className="bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-800/60 pointer-events-auto flex gap-2 w-full max-w-md">
          <button 
            onClick={() => setIsImageModalOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-indigo-900/20 text-indigo-400 rounded-xl transition-colors"
          >
            <ImageIcon size={24} />
            <span className="text-xs font-semibold">Add Image</span>
          </button>
          
          <div className="w-px bg-slate-800 my-2"></div>
          
          <button 
            onClick={() => setIsVideoModalOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 hover:bg-red-900/20 text-red-400 rounded-xl transition-colors"
          >
            <Youtube size={24} />
            <span className="text-xs font-semibold">Add Video</span>
          </button>
        </div>
      </div>

      <AddVideoModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        onAdd={(url, title) => handleAddVideo(url, title)}
      />
      <UploadImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        onUpload={handleAddImage} 
      />
    </div>
  );
}
