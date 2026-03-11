import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LogIn } from 'lucide-react';

// Stubbing out Supabase auth for now
// import { supabase } from '../lib/supabase';

export default function Login() {
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const navigate = useNavigate();

  const handleTeacherLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsTeacherLoading(true);
    // STUB: Simulate login delay
    setTimeout(() => {
      setIsTeacherLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  const handleStudentAccess = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsStudentLoading(true);
    const formData = new FormData(e.currentTarget);
    const classCode = formData.get('classCode') as string;
    // STUB: Simulate verification
    setTimeout(() => {
      setIsStudentLoading(false);
      if (classCode) {
        navigate(`/student/${classCode}`);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-800">
        
        {/* Teacher Section */}
        <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 relative group">
          <div className="absolute inset-0 bg-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-900/40 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <BookOpen size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-50 mb-2 font-serif">Teacher Portal</h2>
            <p className="text-slate-400 mb-8">Sign in to manage your lessons and materials.</p>
            
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  defaultValue="teacher@edustream.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="name@school.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input 
                  type="password" 
                  defaultValue="password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border-slate-700 text-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={isTeacherLoading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center shadow-lg shadow-indigo-900/20 disabled:opacity-70"
              >
                {isTeacherLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} className="mr-2" /> Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Student Section */}
        <div className="p-8 md:p-12 relative group bg-slate-900/50">
          <div className="absolute inset-0 bg-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-cyan-900/40 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <GraduationCap size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-50 mb-2 font-serif">Student Access</h2>
            <p className="text-slate-400 mb-8">Enter your class code to view materials.</p>
            
            <form onSubmit={handleStudentAccess} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Class Code</label>
                <input 
                  type="text" 
                  name="classCode"
                  required
                  defaultValue="DEMO-CLASS"
                  className="w-full px-4 py-4 rounded-xl border-2 border-slate-700 focus:ring-0 focus:border-cyan-500 transition-all outline-none text-2xl tracking-widest text-center font-mono uppercase bg-slate-800 shadow-inner text-slate-50"
                  placeholder="ENTER-CODE"
                />
              </div>
              <button 
                type="submit" 
                disabled={isStudentLoading}
                className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-lg disabled:opacity-70 disabled:hover:scale-100"
              >
                {isStudentLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Enter Class'
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
