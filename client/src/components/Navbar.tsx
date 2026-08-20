import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ShieldCheck, User, LogOut, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoSwitch = async (email: string, password: string) => {
    try {
      await quickLogin(email, password);
      navigate('/');
    } catch (err) {
      console.error('Demo switch failed', err);
    }
  };

  return (
    <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 group-hover:border-emerald-500/60 transition-all">
            <Truck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
              SwiftLastMile <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">v1.0</span>
            </span>
            <p className="text-xs text-slate-400">Intelligent Rate Engine & Auto-Assignment</p>
          </div>
        </Link>

        {/* Quick Demo Role Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium px-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Demo Switch:
          </span>
          <button
            onClick={() => handleDemoSwitch('admin@delivery.com', 'admin123')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'ADMIN' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => handleDemoSwitch('customer@delivery.com', 'password123')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'CUSTOMER' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => handleDemoSwitch('agent.rahul@delivery.com', 'password123')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              user?.role === 'AGENT' ? 'bg-blue-500 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Agent
          </button>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-semibold text-slate-200">{user.name}</p>
                <p className="text-slate-400 capitalize">{user.role.toLowerCase()}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all border border-slate-700/60"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
