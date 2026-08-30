import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  LogIn, 
  UserCheck, 
  Shield, 
  FileText, 
  Lock, 
  Sparkles, 
  Users, 
  Printer, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const AuthLoginView: React.FC = () => {
  const { loginWithCredentials, switchDemoUser, allUsers, isLoading } = useAuth();
  
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await loginWithCredentials(identifier, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-900 selection:bg-indigo-500 selection:text-white">
      {/* Decorative gradient blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Country Office Leave System
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Digital Fast-Track & Paperback Leave Verification System with Google Drive & Calendar integration.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-zinc-200">
          <form className="space-y-4" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or user@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing in...' : 'Sign In to Leave Portal'}</span>
            </button>
          </form>

          {/* Quick Role Switcher for Seamless Prototype Verification */}
          <div className="mt-6 pt-6 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Prototype Quick Role Switcher
              </span>
              <span className="text-[10px] text-zinc-400">Click to preview role</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin');
                  setPassword('admin123');
                  switchDemoUser('user_admin');
                }}
                className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition"
              >
                <span className="font-bold text-purple-950 block text-[11px]">HR Admin</span>
                <span className="text-[10px] text-purple-700">admin / admin123</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('coordinator');
                  setPassword('admin123');
                  switchDemoUser('user_coord');
                }}
                className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition"
              >
                <span className="font-bold text-blue-950 block text-[11px]">Leave Coordinator</span>
                <span className="text-[10px] text-blue-700">Verify & forward slips</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('dcd');
                  setPassword('admin123');
                  switchDemoUser('user_dcd');
                }}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-left transition"
              >
                <span className="font-bold text-indigo-950 block text-[11px]">DCD Approver</span>
                <span className="text-[10px] text-indigo-700">Deputy Country Dir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('cd');
                  setPassword('admin123');
                  switchDemoUser('user_cd');
                }}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition"
              >
                <span className="font-bold text-emerald-950 block text-[11px]">Country Director</span>
                <span className="text-[10px] text-emerald-700">Final executive sign-off</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('aarav');
                  setPassword('admin123');
                  switchDemoUser('user_emp1');
                }}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl text-left col-span-2 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-zinc-900 block text-[11px]">Aarav K.C. (Employee)</span>
                  <span className="text-[10px] text-zinc-500">Submit requests & view personal balance</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
