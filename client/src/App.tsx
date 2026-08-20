import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { CustomerPortal } from './pages/CustomerPortal';
import { AgentPortal } from './pages/AgentPortal';
import { AdminPortal } from './pages/AdminPortal';
import { Login } from './pages/Login';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Loading SwiftLastMile Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render Portal based on User Role
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main>
        {user.role === 'ADMIN' && <AdminPortal />}
        {user.role === 'CUSTOMER' && <CustomerPortal />}
        {user.role === 'AGENT' && <AgentPortal />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
