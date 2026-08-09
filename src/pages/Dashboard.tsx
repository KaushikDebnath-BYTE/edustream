import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, LogOut, BookOpen, Loader2, ArrowRight, LayoutDashboard, ChevronDown, FolderPlus } from 'lucide-react';

interface Workspace { id: string; title: string; code: string; teacher_id: string; }
interface Lesson { id: string; title: string; code: string; workspace_id: string; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      fetchLessonsForWorkspace(activeWorkspace.id);
    }
  }, [activeWorkspace]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }
    setUserId(session.user.id);

    // Fetch Workspaces owned by this teacher
    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!wsError && wsData && wsData.length > 0) {
      setWorkspaces(wsData);
      setActiveWorkspace(wsData[0]); // Auto-load the most recent dashboard
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
    }
    setIsLoading(false);
  };

  const fetchLessonsForWorkspace = async (workspaceId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });
      
    if (!error && data) setLessons(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleCreateWorkspace = async () => {
    const title = window.prompt("Enter a name for your new Master Dashboard (e.g., '2026 Physics Cohort'):");
    if (!title || !title.trim() || !userId) return;

    const newWorkspace = {
      id: crypto.randomUUID(),
      title: title.trim(),
      code: generateCode(),
      teacher_id: userId
    };

    const { error } = await supabase.from('workspaces').insert([newWorkspace]);

    if (!error) {
      setWorkspaces(prev => [newWorkspace, ...prev]);
      setActiveWorkspace(newWorkspace);
    } else {
      alert("Failed to create workspace.");
    }
  };

  const handleCreateLesson = async () => {
    if (!activeWorkspace || !userId) return;
    const title = window.prompt("Enter the Subject/Lesson title (e.g., 'Thermodynamics'):");
    if (!title || !title.trim()) return;

    const newLesson = {
      id: crypto.randomUUID(),
      title: title.trim(),
      code: generateCode(), // Kept for legacy compatibility
      teacher_id: userId,
      workspace_id: activeWorkspace.id
    };

    const { error } = await supabase.from('lessons').insert([newLesson]);
    if (!error) {
      navigate(`/editor/${newLesson.id}`);
    } else {
      alert("Failed to create lesson.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  }

  // MODE 1: ZERO WORKSPACES (First Time Login)
  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <LayoutDashboard className="text-blue-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mb-4">Welcome to Your Portal</h1>
          <p className="text-slate-400 text-sm mb-8">You don't have any active dashboards yet. Create your first master workspace to start organizing your lessons.</p>
          <button onClick={handleCreateWorkspace} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mb-4">
            Create New Dashboard <ArrowRight size={18} />
          </button>
          <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 text-sm transition-colors">Sign Out</button>
        </div>
      </div>
    );
  }

  // MODE 2: ACTIVE WORKSPACE LOADED
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Dynamic Header with Switcher */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Workspace Switcher */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <div className="relative group">
              <select 
                value={activeWorkspace.id}
                onChange={(e) => {
                  if (e.target.value === 'NEW') handleCreateWorkspace();
                  else {
                    const selected = workspaces.find(w => w.id === e.target.value);
                    if (selected) setActiveWorkspace(selected);
                  }
                }}
                className="appearance-none bg-slate-950 border border-slate-700 text-slate-100 font-bold rounded-lg pl-4 pr-10 py-2 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
                <option value="NEW" className="text-blue-400 font-semibold">+ Create New Dashboard</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Active Workspace Info Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 shadow-xl mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-50 mb-2">{activeWorkspace.title}</h2>
            <p className="text-slate-400">Share the code below with your students so they can access all lessons inside this dashboard.</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-6 py-4 rounded-2xl text-center shrink-0">
            <span className="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Workspace Code</span>
            <span className="text-3xl font-mono font-bold text-blue-400 tracking-widest">{activeWorkspace.code}</span>
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-50 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-500" /> Subjects & Lessons
          </h3>
          <button onClick={handleCreateLesson} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700 flex items-center gap-2">
            <Plus size={16} /> Add Lesson
          </button>
        </div>
          
        {lessons.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl border-2 border-slate-800 border-dashed p-12 text-center">
            <FolderPlus size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">This dashboard is empty. Add your first subject or lesson module to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map(lesson => (
              <button 
                key={lesson.id} 
                onClick={() => navigate(`/editor/${lesson.id}`)}
                className="flex flex-col text-left p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all group shadow-sm hover:shadow-blue-900/20"
              >
                <div className="p-3 bg-slate-950 w-fit rounded-xl group-hover:bg-blue-900/30 transition-colors mb-4">
                  <BookOpen size={24} className="text-blue-400" />
                </div>
                <h4 className="font-semibold text-xl text-slate-100 group-hover:text-blue-400 transition-colors truncate w-full">{lesson.title}</h4>
                <span className="text-sm text-slate-500 mt-2">Click to edit materials →</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
