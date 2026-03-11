import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeleteLessonButtonProps {
  lessonId: string;
  onSuccess?: () => void;
}

export function DeleteLessonButton({ lessonId, onSuccess }: DeleteLessonButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation if button is inside a clickable card
    
    // Strict confirmation mechanism
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this lesson? This action cannot be undone."
    );
    
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      
      // REMINDER: Ensure ON DELETE CASCADE is enabled on the 'materials' table in Supabase
      // so the database automatically cleans up associated foreign key records.
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete the lesson. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className={`px-3 hover:bg-red-50 text-slate-400 hover:text-red-600 py-2 rounded-lg text-sm font-medium border border-slate-200 transition-colors shadow-sm ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Delete Lesson"
    >
      <Trash2 size={16} className={isDeleting ? 'animate-pulse' : ''} />
    </button>
  );
}
