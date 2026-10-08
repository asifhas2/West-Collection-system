import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Recycle, User, Truck, ShieldAlert, LogOut, Sparkles, Award } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { currentUser, activeRole, quickSwitchRole, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Top Demo Bar */}
      <div className="bg-emerald-950/80 px-4 py-1.5 text-xs text-emerald-200 border-b border-emerald-800/40 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">Role Switcher:</span>
          <span>Switch profiles for evaluation</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-0.5 rounded-lg border border-emerald-700/50">
          <button
            onClick={() => quickSwitchRole('user')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 ${
              activeRole === 'user' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <User className="w-3 h-3" /> User
          </button>
          <button
            onClick={() => quickSwitchRole('collector')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 ${
              activeRole === 'collector' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3 h-3" /> Collector
          </button>
          <button
            onClick={() => quickSwitchRole('admin')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 ${
              activeRole === 'admin' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3 h-3" /> Admin
          </button>
          <button
            onClick={() => quickSwitchRole('guest')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 ${
              activeRole === 'guest' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Public Site
          </button>
        </div>
      </div>

      {/* Main Header Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-950 font-bold flex items-center justify-center">
            <Recycle className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              EcoCollect <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">C Backend</span>
            </div>
            <div className="text-xs text-slate-400">Smart Waste & Reward System</div>
          </div>
        </div>

        {/* Portal Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'home' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Home / About
          </button>

          {activeRole === 'user' && (
            <>
              <button
                onClick={() => setActiveTab('user-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'user-dashboard' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                User Portal
              </button>
              <button
                onClick={() => setActiveTab('new-request')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'new-request' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                New Collection Request
              </button>
              <button
                onClick={() => setActiveTab('user-tracking')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'user-tracking' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Track Requests
              </button>
            </>
          )}

          {activeRole === 'collector' && (
            <>
              <button
                onClick={() => setActiveTab('collector-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'collector-dashboard' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Collector Workspace
              </button>
              <button
                onClick={() => setActiveTab('collector-route')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'collector-route' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Collection Route Map
              </button>
            </>
          )}

          {activeRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'admin-dashboard' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Admin Command Center
              </button>
              <button
                onClick={() => setActiveTab('admin-dispatch')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'admin-dispatch' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Approvals & Dispatch
              </button>
              <button
                onClick={() => setActiveTab('admin-routes')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'admin-routes' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Route Optimizer Map
              </button>
              <button
                onClick={() => setActiveTab('admin-reports')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'admin-reports' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Reports & Analytics
              </button>
            </>
          )}
        </nav>

        {/* User Badge / Auth state */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {activeRole === 'user' && (
                <div className="hidden sm:flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.rewardPoints || 0} Points</span>
                </div>
              )}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-100">{currentUser.name}</div>
                <div className="text-xs text-slate-400 capitalize">{currentUser.role} Account</div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => quickSwitchRole('user')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
            >
              Sign In / Quick Demo
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
