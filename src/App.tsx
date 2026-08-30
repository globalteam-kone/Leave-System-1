import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Plus, 
  BarChart3, 
  Settings, 
  LogOut, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Printer, 
  Sparkles,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  Clock,
  Inbox,
  FileText,
  Activity,
  Server,
  Database,
  Search
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { LeaveRequestsListView } from './components/LeaveRequestsListView';
import { AdminManagementView } from './components/AdminManagementView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { SubmitLeaveModal } from './components/SubmitLeaveModal';
import { LeaveDetailModal } from './components/LeaveDetailModal';
import { AuthLoginView } from './components/AuthLoginView';
import { LeaveRequest } from './types';

export default function App() {
  const { currentUser, allUsers, switchDemoUser, logout, appSettings, updateSettings, leaveRequests } = useAuth();

  const [activeNav, setActiveNav] = useState<'requests' | 'analytics' | 'admin'>('requests');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState<boolean>(false);

  if (!currentUser) {
    return <AuthLoginView />;
  }

  const role = currentUser.role;

  // Counts for sidebar badges
  const pendingCoordinatorCount = leaveRequests.filter(r => r.status === 'pending_coordinator' || r.status === 'pending_upload_scanned').length;
  const pendingApprovalsCount = leaveRequests.filter(r => r.status === 'pending_dcd' || r.status === 'pending_cd').length;
  const myTotalCount = leaveRequests.filter(r => r.employeeId === currentUser.id).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        {/* Brand & System Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {appSettings.organizationName}{' '}
              <span className="text-slate-400 font-normal text-xs sm:text-sm">
                | {appSettings.countryOffice} Leave System
              </span>
            </h1>
          </div>
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Dual Mode Switcher Pill */}
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            <button
              onClick={() => updateSettings({ defaultWorkflowMode: 'digital' })}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition ${
                appSettings.defaultWorkflowMode === 'digital'
                  ? 'bg-white shadow-xs text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ⚡ Digital Mode
            </button>
            <button
              onClick={() => updateSettings({ defaultWorkflowMode: 'paperback' })}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition ${
                appSettings.defaultWorkflowMode === 'paperback'
                  ? 'bg-white shadow-xs text-amber-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📄 Paperback Mode
            </button>
          </div>

          {/* Quick Apply Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave</span>
          </button>

          {/* User Profile & Persona Switcher */}
          <div className="relative pl-3 sm:pl-6 border-l border-slate-200">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {role === 'dcd' ? 'Deputy Country Dir' : role === 'cd' ? 'Country Director' : role}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 group-hover:border-blue-500 transition">
                {currentUser.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Persona Switcher Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Switch Active Persona (Prototype)
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold">{role.toUpperCase()}</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchDemoUser(u.id);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition ${
                        currentUser.id === u.id ? 'bg-blue-50 font-bold text-blue-900' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{u.displayName}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.jobTitle} • <span className="uppercase font-semibold">{u.role}</span>
                        </div>
                      </div>
                      {currentUser.id === u.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-2 pt-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      logout();
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* App Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Dark Sidebar Navigation */}
        <aside className="w-56 bg-slate-900 text-slate-300 shrink-0 hidden md:flex flex-col justify-between border-r border-slate-800">
          <nav className="flex-1 py-4">
            <div className="px-4 mb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Main Navigation
            </div>
            
            <button
              onClick={() => setActiveNav('requests')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition text-xs font-semibold text-left ${
                activeNav === 'requests'
                  ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Leave Applications</span>
              {role === 'employee' ? (
                <span className="ml-auto bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {myTotalCount}
                </span>
              ) : (
                <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {leaveRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition text-xs font-semibold text-left ${
                activeNav === 'analytics'
                  ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                  : 'hover:bg-slate-800 hover:text-white text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Leave Analytics & Logs</span>
            </button>

            {(role === 'coordinator' || role === 'admin') && (
              <div className="mt-4">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Verification Queue
                </div>
                <div className="px-4 py-2 bg-slate-800/40 rounded-lg mx-2 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-[11px]">Needs Coordinator</span>
                  <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingCoordinatorCount}
                  </span>
                </div>
              </div>
            )}

            {(role === 'dcd' || role === 'cd' || role === 'admin') && (
              <div className="mt-3">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Approval Queue
                </div>
                <div className="px-4 py-2 bg-slate-800/40 rounded-lg mx-2 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-[11px]">Executive Pending</span>
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingApprovalsCount}
                  </span>
                </div>
              </div>
            )}

            {(role === 'admin' || role === 'coordinator') && (
              <div className="mt-5">
                <div className="px-4 mb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Administration
                </div>
                <button
                  onClick={() => setActiveNav('admin')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition text-xs font-semibold text-left ${
                    activeNav === 'admin'
                      ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Admin & Workflow Control</span>
                </button>
              </div>
            )}
          </nav>

          {/* Bottom Integrations Status Box */}
          <div className="p-3.5 bg-slate-800/60 m-3 rounded-xl border border-slate-700">
            <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold tracking-widest">
              Live Integrations
            </div>
            <div className="flex items-center gap-2 text-[11px] text-green-400 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
              <span className="truncate">Google Drive Linked</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-green-400 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div>
              <span className="truncate">Calendar Synced</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-blue-400">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
              <span className="truncate">Firestore & Sheets Active</span>
            </div>
          </div>
        </aside>

        {/* Mobile Header Nav bar for small screens */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveNav('requests')}
            className={`px-3 py-1.5 rounded-lg ${activeNav === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveNav('analytics')}
            className={`px-3 py-1.5 rounded-lg ${activeNav === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Analytics
          </button>
          {(role === 'admin' || role === 'coordinator') && (
            <button
              onClick={() => setActiveNav('admin')}
              className={`px-3 py-1.5 rounded-lg ${activeNav === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              Admin Controls
            </button>
          )}
        </div>

        {/* Main Content Pane */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto bg-slate-50 min-w-0">
          <div className="max-w-7xl w-full mx-auto space-y-6 pb-12 md:pb-0">
            {activeNav === 'requests' && (
              <LeaveRequestsListView
                onSelectRequest={(req) => setSelectedRequest(req)}
                onOpenSubmitModal={() => setShowSubmitModal(true)}
              />
            )}

            {activeNav === 'analytics' && <AnalyticsDashboardView />}

            {activeNav === 'admin' && <AdminManagementView />}
          </div>
        </main>
      </div>

      {/* High Density Footer */}
      <footer className="hidden md:flex px-6 py-2 bg-white border-t border-slate-200 text-[10px] justify-between items-center text-slate-500">
        <div className="flex gap-4">
          <span>System Status: <span className="text-emerald-600 font-bold uppercase">Optimal</span></span>
          <span>Firebase Firestore: <span className="text-slate-700 font-medium">Connected</span></span>
          <span>Google Drive: <span className="text-slate-700 font-medium">Authenticated</span></span>
          <span>Active Workflow: <span className="text-blue-600 font-bold uppercase">{appSettings.defaultWorkflowMode}</span></span>
        </div>
        <div className="font-mono text-slate-400">LM-PRO build: v2.4.0-stable</div>
      </footer>

      {/* Modals */}
      <SubmitLeaveModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={(id) => {
          // Action on submit
        }}
      />

      <LeaveDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
