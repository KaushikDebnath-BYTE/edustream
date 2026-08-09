import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle, GraduationCap, Presentation } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        // First-time registration WITH metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role, // Saves 'student' or 'teacher' to the user's metadata
            }
          }
        });
        if (error) throw error;
        alert('Account created! Please sign in.');
        setIsSignUp(false); // Switch to sign-in view
      } else {
        // Returning user login
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Traffic Control Check (Temporary local check before we upgrade App.tsx)
        const userRole = data.user?.user_metadata?.role;
        if (userRole === 'teacher') {
          navigate('/dashboard');
        } else {
          navigate('/student-view'); // Default route for students
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-200">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">EduStream</h1>
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Create your account' : 'Welcome back to your laboratory'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          
          {/* Role Selector - Only visible during Sign Up */}
          {isSignUp && (
            <div className="space-y-2 mb-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    role === 'student'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <GraduationCap size={16} /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    role === 'teacher'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <Presentation size={16} /> Teacher
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-500" />
              </div>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                placeholder="••••••••" minLength={6}
              />
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
