import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import StudentView from './pages/StudentView';
import LessonEditor from './pages/LessonEditor';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'teacher' | 'student';
  session: Session | null;
}

function ProtectedRoute({ children, allowedRole, session }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to="/" replace />;
  }

  const userRole = session.user?.user_metadata?.role;

  if (allowedRole && userRole !== allowedRole) {
    if (userRole === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/student-view" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span className="text-slate-400 text-sm font-medium">Authenticating...</span>
        </div>
      </div>
    );
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen font-sans bg-slate-950 text-slate-50">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRole="teacher" session={session}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ProtectedRoute allowedRole="teacher" session={session}>
                <LessonEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-view"
            element={
              <ProtectedRoute session={session}>
                <StudentView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/:classCode"
            element={
              <ProtectedRoute session={session}>
                <StudentView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
