import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, LogOut, MoreVertical, Edit2 } from 'lucide-react';
import { supabase, type Lesson } from '../lib/supabase';
import { DeleteLessonButton } from '../components/DeleteLessonButton';

export default function Dashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchLessons = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted && data) {
          setLessons(data as Lesson[]);
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchLessons();
    return () => { isMounted = false; };
  }, []);

  const filteredLessons = lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLesson = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const classCode = Array.from({length: 6}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
      
      const { data: userData } = await supabase.auth.getUser();
      
      const newLessonData = {
        title,
        code: classCode,
        teacher_id: userData.user?.id || '00000000-0000-0000-0000-000000000000'
      };
      
      const { data, error } = await supabase
        .from('lessons')
        .insert(newLessonData)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setIsCreating(false);
        navigate(`/lesson/${data.id}/edit`);
      }
    } catch (err) {
      console.error('Error creating lesson:', err);
      alert('Failed to create lesson. Please try again.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-md">
                <BookOpen size={24} />
              </div>
              <span className="font-serif font-bold text-xl text-slate-800 tracking-tight">EduStream</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Lessons</h1>
            <p className="text-slate-500 mt-1">Manage and organize your learning materials.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-5 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200"
            >
              <Plus size={20} />
              New Lesson
            </button>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-500 font-medium">Loading lessons...</span>
            </div>
          ) : filteredLessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 shadow-sm">
                    Code: {lesson.code}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                   {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString() : 'Just now'}
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex gap-2 border-t border-slate-100">
                <button 
                  onClick={() => navigate(`/lesson/${lesson.id}/edit`)}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Edit2 size={16} /> Edit Materials
                </button>
                <DeleteLessonButton 
                  lessonId={lesson.id} 
                  onSuccess={() => setLessons(prev => prev.filter(l => l.id !== lesson.id))} 
                />
              </div>
            </div>
          ))}
          
          {(!isLoading && filteredLessons.length === 0) && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="mx-auto w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No lessons found</h3>
              <p className="text-slate-500">Try adjusting your search or create a new lesson.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Lesson Modal Placeholder */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm shadow-2xl z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 font-serif">Create New Lesson</h2>
            <p className="text-slate-500 mb-6 text-sm">Give your new lesson module a clear, descriptive title.</p>
            <form onSubmit={handleCreateLesson}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Title</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  autoFocus
                  placeholder="e.g. Introduction to Photosynthesis"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-md shadow-indigo-200 disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitLoading ? 'Creating...' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
