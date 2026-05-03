import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import AIChatWindow from './components/AIChatWindow';

const Dashboard = () => {
  const [activeRoom, setActiveRoom] = useState({ id: 'global', name: 'Global Chat', isGlobal: true, isAI: false });

  const handleSelectRoom = (id: string, name: string, isGlobal?: boolean, isAI?: boolean) => {
    setActiveRoom({ id, name, isGlobal: !!isGlobal, isAI: !!isAI });
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onSelectRoom={handleSelectRoom} activeRoom={activeRoom.id} />
      {activeRoom.isAI
        ? <AIChatWindow />
        : <ChatWindow roomId={activeRoom.id} roomName={activeRoom.name} isGlobal={activeRoom.isGlobal} />
      }
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  // Always light mode
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f3f4', color: '#1a73e8', fontSize: '1.2rem', fontWeight: 700 }}>
      Laddar Chataaa...
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
