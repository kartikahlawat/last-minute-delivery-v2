import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ShieldCheck, UserCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setError(null);
    try {
      await quickLogin(demoEmail, demoPass);
      navigate('/');
    } catch (err: any) {
      setError('Quick login failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 mb-3">
            <Truck className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to SwiftLastMile</h1>
          <p className="text-xs text-slate-400 mt-1">Delivery Tracker & Dispatch Management Portal</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="e.g. admin@delivery.com"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Quick Evaluator Demo Logins
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleQuickDemo('admin@delivery.com', 'admin123')}
              className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Demo Account
              </span>
              <span className="text-[10px] text-slate-500 font-mono">admin@delivery.com</span>
            </button>

            <button
              onClick={() => handleQuickDemo('customer@delivery.com', 'password123')}
              className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2 font-medium">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Customer Demo Account
              </span>
              <span className="text-[10px] text-slate-500 font-mono">customer@delivery.com</span>
            </button>

            <button
              onClick={() => handleQuickDemo('agent.rahul@delivery.com', 'password123')}
              className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2 font-medium">
                <Truck className="w-4 h-4 text-blue-400" /> Delivery Agent Account
              </span>
              <span className="text-[10px] text-slate-500 font-mono">agent.rahul@delivery.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
