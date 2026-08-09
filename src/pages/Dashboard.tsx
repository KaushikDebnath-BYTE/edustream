import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Key, LogOut, BookOpen, Loader2, ArrowRight } from 'lucide-react';

interface Lesson { id: string; title: string; code: string; created_at: string; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndClasses();
  }, []);

  const fetchUserAndClasses = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }
    
    setUserId(session.user.id);

    // Fetch ONLY the classes created by this specific teacher
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('teacher_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyClasses(data);
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateClass = async () => {
    const title = window.prompt("Enter a name for your new class (e.g., 'Advanced Physics'):");
    if (!title || !title.trim() || !userId) return;

    const newId = crypto.randomUUID();
    const newCode = generateCode();

    const { error } = await supabase.from('lessons').insert({
      id: newId,
      title: title.trim(),
      code: newCode,
      teacher_id: userId
    });

    if (!error) {
      navigate(`/editor/${newId}`);
    } else {
      alert("Failed to create class. Please try again.");
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    setIsJoining(true);
    setJoinError('');

    const { data, error } = await supabase
      .from('lessons')
      .select('id')
      .eq('code', joinCode.toUpperCase().trim())
      .single();

    if (error || !data) {
      setJoinError("Invalid code. Classroom not found.");
      setIsJoining(false);
    } else {
      // Phase into the other teacher's dashboard
      navigate(`/editor/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <BookOpen className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-50">Teacher Dashboard</h1>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Gateway Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Create New Dimension */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-center items-start group hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Plus className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Create New Class</h2>
            <p className="text-slate-400 text-sm mb-8">Set up a brand new, isolated dashboard for your students and generate a unique join code.</p>
            <button onClick={handleCreateClass} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
              Initialize Dashboard <ArrowRight size={18} />
            </button>
          </div>

          {/* Phase Into Existing Dimension */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-center items-start">
            <div className="w-12 h-12 bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
              <Key className="text-emerald-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-50 mb-2">Access Shared Dashboard</h2>
            <p className="text-slate-400 text-sm mb-6">Enter a code provided by another teacher to view or co-edit their classroom materials.</p>
            
            <form onSubmit={handleJoinClass} className="w-full space-y-4">
              <div className="relative">
                <input
                  type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. RNPP5R"
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase placeholder:normal-case font-mono tracking-widest"
                />
              </div>
              {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
              <button disabled={isJoining} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2">
                {isJoining ? <Loader2 size={18} className="animate-spin" /> : 'Connect to Dashboard'}
              </button>
            </form>
          </div>
        </div>

        {/* My Workspaces List */}
        <div>
          <h3 className="text-xl font-bold text-slate-50 mb-6 flex items-center gap-2">
            Your Active Dashboards
          </h3>
          
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : myClasses.length === 0 ? (
            <div className="bg-slate-900/50 rounded-2xl border-2 border-slate-800 border-dashed p-12 text-center">
              <p className="text-slate-400">You haven't created any classes yet. Initialize your first dashboard above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses.map(lesson => (
                <button 
                  key={lesson.id} 
                  onClick={() => navigate(`/editor/${lesson.id}`)}
                  className="flex flex-col text-left p-6 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all group shadow-sm hover:shadow-blue-900/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-slate-950 rounded-lg group-hover:bg-blue-900/30 transition-colors">
                      <BookOpen size={20} className="text-blue-400" />
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950 rounded-md border border-slate-800 text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                      {lesson.code}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition-colors truncate w-full">{lesson.title}</h4>
                  <span className="text-sm text-slate-500 mt-1">Click to edit materials →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
