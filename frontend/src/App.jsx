import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MeetingRoom from './pages/MeetingRoom';
import JoinMeeting from './pages/JoinMeeting';

function RequireAdmin({ children }) {
  if (!localStorage.getItem('adminToken')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <Router>
      <div className={`app ${theme}-theme`}>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route path="/meet/:roomId" element={<MeetingRoom />} />
          <Route path="/:roomId" element={<JoinMeeting />} />
          <Route path="/" element={<JoinMeeting />} />
        </Routes>
      </div>
    </Router>
  );
}
