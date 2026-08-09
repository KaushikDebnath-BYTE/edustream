import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, LogOut, Loader2, BookOpen, Copy, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Workspace { id: string; title: string; code: string; }
interface Lesson { id: string; title: string; }

export default function StudentView() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const [enrolledWorkspaces, setEnrolledWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaceLessons, setWorkspaceLessons] = useState<Lesson[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/');
      return;
    }
    setUserId(session.user.id);

    // Fetch enrollments mapped to workspace data
    const { data, error } = await supabase
      .from('student_enrollments')
      .select('workspace_id, workspaces(id, title, code)')
      .eq('student_id', session.user.id);

    if (!error && data) {
      const formatted = data.map((d: any) => d.workspaces).filter(Boolean);
      setEnrolledWorkspaces(formatted);
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !userId) return;
    
    setIsJoining(true);
    setErrorMsg(null);

    try {
      // 1. Find the workspace by code
      const { data: wsData, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('code', joinCode.toUpperCase().trim())
        .single();
      
      if (wsError || !wsData) throw new Error("Invalid code. Workspace not found.");

      // 2. Enroll the student (ignore error if already enrolled due to unique constraint)
      await supabase.from('student_enrollments').insert({
        student_id: userId,
        workspace_id: wsData.id
      });

      // 3. Fetch lessons for this workspace
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('workspace_id', wsData.id)
        .order('created_at', { ascending: true });

      setActiveWorkspace(wsData);
      setWorkspaceLessons(lessonsData || []);
      
      // Update local state so it shows up in their list next time
      if (!enrolledWorkspaces.find(w => w.id === wsData.id)) {
        setEnrolledWorkspaces(prev => [...prev, wsData]);
      }
      
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const loadExistingWorkspace = async (workspace: Workspace) => {
    setIsLoading(true);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true });
      
    setActiveWorkspace(workspace);
    setWorkspaceLessons(lessonsData || []);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {activeWorkspace && (
              <button onClick={() => setActiveWorkspace(null)} className="mr-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-bold text-slate-50">Student Portal</h1>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {!activeWorkspace ? (
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Join New Workspace */}
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
              <h2 className="text-2xl font-bold mb-2 text-slate-50">Join a Workspace</h2>
              <p className="text-slate-400 text-sm mb-6">Enter the 6-letter master code provided by your teacher.</p>
              <form onSubmit={handleJoinWorkspace} className="space-y-4">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. RNPP5R"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:normal-case font-mono tracking-widest"
                  />
                </div>
                {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
                <button disabled={isJoining} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2">
                  {isJoining ? <Loader2 size={18} className="animate-spin" /> : 'Access Materials'}
                </button>
              </form>
            </div>

            {/* Previously Enrolled Workspaces */}
            <div>
              <h3 className="text-xl font-bold text-slate-50 mb-6 border-b border-slate-800 pb-2">My Enrolled Dashboards</h3>
              {enrolledWorkspaces.length === 0 ? (
                <div className="bg-slate-900/50 p-8 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                  You haven't joined any workspaces yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledWorkspaces.map(ws => (
                    <div key={ws.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                      <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => loadExistingWorkspace(ws)}>
                        <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{ws.title}</h4>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 block">Code: {ws.code}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(ws.code); }}
                        className="p-2 ml-4 text-slate-400 hover:text-white bg-slate-950 rounded-lg border border-slate-800 transition-all"
                        title="Copy Code"
                      >
                        {copiedCode === ws.code ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Inside an Active Workspace */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-slate-800 pb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full mb-3 inline-block">Workspace: {activeWorkspace.code}</span>
              <h2 className="text-3xl font-bold text-slate-50">{activeWorkspace.title}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaceLessons.length === 0 ? (
                <p className="text-slate-500 italic col-span-full">No lessons have been added to this workspace yet.</p>
              ) : (
                workspaceLessons.map(lesson => (
                  <div key={lesson.id} className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-start gap-4">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-blue-400 border border-slate-800">
                      <BookOpen size={24} />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-100">{lesson.title}</h3>
                    <button onClick={() => navigate(`/lesson/${lesson.id}`)} className="mt-auto w-full py-2 bg-slate-950 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-800 rounded-lg text-sm transition-colors">
                      View Materials
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
