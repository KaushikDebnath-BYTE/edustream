import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import StudentView from './pages/StudentView';
import LessonEditor from './pages/LessonEditor';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen font-sans bg-slate-950 text-slate-50">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lesson/:id/edit" element={<LessonEditor />} />
          <Route path="/student/:classCode" element={<StudentView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
