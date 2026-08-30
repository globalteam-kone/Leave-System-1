import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Settings, 
  FolderSync, 
  Database, 
  Calendar, 
  Layers, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  Trash2, 
  Edit3, 
  ShieldCheck,
  FileSpreadsheet,
  HardDrive,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role, WorkflowMode, UserProfile } from '../types';
import { GoogleWorkspaceService } from '../lib/workspace';

export const AdminManagementView: React.FC = () => {
  const { 
    allUsers, 
    appSettings, 
    updateSettings, 
    registerUser, 
    deleteUser, 
    updateUserBalance, 
    updateUserProfile 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'workflow' | 'users' | 'workspace'>('workflow');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('employee');
  const [newUserJobTitle, setNewUserJobTitle] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('Programs');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);

  // Edit Balance State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [balanceEditAnnual, setBalanceEditAnnual] = useState(18);
  const [balanceEditSick, setBalanceEditSick] = useState(12);
  const [balanceEditCasual, setBalanceEditCasual] = useState(6);
  const [balanceEditEmergency, setBalanceEditEmergency] = useState(5);

  // Workspace Setup State
  const [sheetIdInput, setSheetIdInput] = useState(appSettings.linkedGoogleSheetId || '');
  const [driveFolderInput, setDriveFolderInput] = useState(appSettings.linkedGoogleDriveFolderId || '');
  const [isCreatingMasterSheet, setIsCreatingMasterSheet] = useState(false);
  const [workspaceSuccessMsg, setWorkspaceSuccessMsg] = useState<string | null>(null);

  const handleToggleWorkflowMode = async (newMode: WorkflowMode) => {
    await updateSettings({ defaultWorkflowMode: newMode });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newDisplayName || !newUsername) return;

    setIsCreatingUser(true);
    const res = await registerUser({
      email: newUserEmail,
      username: newUsername,
      displayName: newDisplayName,
      role: newUserRole,
      jobTitle: newUserJobTitle || 'Staff Member',
      department: newUserDepartment,
      phoneNumber: newUserPhone,
      password: newUserPassword,
    });
    setIsCreatingUser(false);

    if (res.success) {
      setUserSuccessMsg(`User ${newDisplayName} (${newUserRole.toUpperCase()}) created successfully!`);
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUsername('');
      setNewDisplayName('');
      setNewUserJobTitle('');
      setTimeout(() => setUserSuccessMsg(null), 4000);
    }
  };

  const handleOpenBalanceEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setBalanceEditAnnual(user.leaveBalance.annual);
    setBalanceEditSick(user.leaveBalance.sick);
    setBalanceEditCasual(user.leaveBalance.casual);
    setBalanceEditEmergency(user.leaveBalance.emergency);
  };

  const handleSaveBalanceEdit = async (userId: string) => {
    await updateUserBalance(userId, {
      annual: Number(balanceEditAnnual),
      sick: Number(balanceEditSick),
      casual: Number(balanceEditCasual),
      emergency: Number(balanceEditEmergency),
      unpaidTaken: 0,
    });
    setEditingUserId(null);
  };

  const handleCreateMasterSheet = async () => {
    setIsCreatingMasterSheet(true);
    const res = await GoogleWorkspaceService.createMasterSpreadsheet(
      `${appSettings.organizationName.replace(/\s+/g, '_')}_Leave_Master_Log_2026`
    );
    setIsCreatingMasterSheet(false);
    if (res.success && res.spreadsheetId) {
      await updateSettings({
        linkedGoogleSheetId: res.spreadsheetId,
        linkedGoogleSheetName: 'Leave_Requests_Log'
      });
      setSheetIdInput(res.spreadsheetId);
      setWorkspaceSuccessMsg(`Master Google Sheet provisioned: ${res.spreadsheetId}`);
      setTimeout(() => setWorkspaceSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">HR & Admin Management Console</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Configure system workflow modes, manage user credentials & roles, and maintain linked Google Drive/Sheets.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'workflow'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Workflow Mode
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users & Roles ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'workspace'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Drive & Sheets
          </button>
        </div>
      </div>

      {userSuccessMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{userSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: WORKFLOW DUAL MODES CONFIGURATION */}
      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">System Workflow Dual-Mode Controller</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                The administrator can set the default system mode. Existing in-progress requests will preserve their initiated mode.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Digital Mode Card */}
              <div
                onClick={() => handleToggleWorkflowMode('digital')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  appSettings.defaultWorkflowMode === 'digital'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                      ⚡ Digital Fast-Track
                    </span>
                    {appSettings.defaultWorkflowMode === 'digital' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                        <Check className="w-3.5 h-3.5" /> Active Default
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">100% Paperless Digital Flow</h3>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Employee applies online → Coordinator verifies and forwards → DCD e-signs → CD grants final approval → Leave balance automatically deducted & Google Calendar synced.
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200 text-[10px] font-semibold text-blue-700">
                  Ideal for rapid approvals and modern paperless governance.
                </div>
              </div>

              {/* Paperback Mode Card */}
              <div
                onClick={() => handleToggleWorkflowMode('paperback')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                  appSettings.defaultWorkflowMode === 'paperback'
                    ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      📄 Paperback Physical Mode
                    </span>
                    {appSettings.defaultWorkflowMode === 'paperback' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                        <Check className="w-3.5 h-3.5" /> Active Default
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Physical Print & Scanned Archive</h3>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Employee submits and prints physical slip → Hands signed paper to Coordinator → Physical ink signatures from DCD & CD → Coordinator uploads scanned copy to finalize.
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200 text-[10px] font-semibold text-amber-700">
                  Compliance ready with physical ink signatures archived to Drive.
                </div>
              </div>
            </div>

            {/* Automation Options */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Automated System Triggers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <span className="font-semibold text-slate-800 text-[11px]">Auto-Deduct Balance</span>
                  <input
                    type="checkbox"
                    checked={appSettings.autoDeductBalance}
                    onChange={(e) => updateSettings({ autoDeductBalance: e.target.checked })}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>
                <label className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <span className="font-semibold text-slate-800 text-[11px]">Google Calendar Sync</span>
                  <input
                    type="checkbox"
                    checked={appSettings.autoSyncCalendar}
                    onChange={(e) => updateSettings({ autoSyncCalendar: e.target.checked })}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>
                <label className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <span className="font-semibold text-slate-800 text-[11px]">Google Sheets Log Sync</span>
                  <input
                    type="checkbox"
                    checked={appSettings.autoSyncSheets}
                    onChange={(e) => updateSettings({ autoSyncSheets: e.target.checked })}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Quick Info & Organization Details */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Organization Profile
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1 text-[11px]">Organization Name</label>
                <input
                  type="text"
                  value={appSettings.organizationName}
                  onChange={(e) => updateSettings({ organizationName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-medium mb-1 text-[11px]">Country Mission / Branch</label>
                <input
                  type="text"
                  value={appSettings.countryOffice}
                  onChange={(e) => updateSettings({ countryOffice: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">System Mode Isolation Rule:</span>
                Switching modes affects new submissions immediately. Pre-existing pending requests will continue executing in their initial submission workflow to prevent audit disruption.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT & ROLE-BASED ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Management & Permissions Matrix</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Create and manage staff profiles for Employees, Coordinators, Approvers (DCD / CD), and HR Admins.
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User Account</span>
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Staff / Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department & Title</th>
                  <th className="p-3 text-center">Leave Balances (A/S/C/E)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allUsers.map((user) => {
                  const isEditingThis = editingUserId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                            {user.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.displayName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              @{user.username || user.email.split('@')[0]} • {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : user.role === 'coordinator'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : user.role === 'dcd'
                              ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              : user.role === 'cd'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {user.role === 'dcd' ? 'Deputy Country Dir' : user.role === 'cd' ? 'Country Director' : user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 font-semibold">{user.jobTitle}</div>
                        <div className="text-slate-500 text-[10px]">{user.department}</div>
                      </td>
                      <td className="p-3 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              title="Annual"
                              value={balanceEditAnnual}
                              onChange={(e) => setBalanceEditAnnual(Number(e.target.value))}
                              className="w-9 px-1 py-0.5 border rounded text-center text-xs"
                            />
                            <input
                              type="number"
                              title="Sick"
                              value={balanceEditSick}
                              onChange={(e) => setBalanceEditSick(Number(e.target.value))}
                              className="w-9 px-1 py-0.5 border rounded text-center text-xs"
                            />
                            <input
                              type="number"
                              title="Casual"
                              value={balanceEditCasual}
                              onChange={(e) => setBalanceEditCasual(Number(e.target.value))}
                              className="w-9 px-1 py-0.5 border rounded text-center text-xs"
                            />
                            <button
                              onClick={() => handleSaveBalanceEdit(user.id)}
                              className="px-2 py-0.5 bg-green-600 text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-xs font-mono">
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-bold" title="Annual Leave">
                              A: {user.leaveBalance.annual}
                            </span>
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-800 rounded font-bold" title="Sick Leave">
                              S: {user.leaveBalance.sick}
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded font-bold" title="Casual Leave">
                              C: {user.leaveBalance.casual}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenBalanceEdit(user)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                            title="Adjust Leave Balances"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE DRIVE & GOOGLE SHEETS STORAGE CONFIG */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Linked Google Drive Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Linked Google Drive Storage</h3>
                <p className="text-[11px] text-slate-500">Centralized document repository for all employee attachments and scanned slips</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-1.5 text-amber-950">
              <p className="font-semibold text-[11px]">
                ✓ Shared Storage Safeguard Active:
              </p>
              <p className="text-[11px] leading-relaxed">
                When staff upload supporting medical certificates or when the coordinator uploads scanned paperback slips, they are saved to the office's linked Google Drive storage bucket, preserving employee personal drive quotas.
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                Google Drive Storage Folder Name
              </label>
              <input
                type="text"
                value={appSettings.linkedGoogleDriveFolderName}
                onChange={(e) => updateSettings({ linkedGoogleDriveFolderName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Linked Google Sheets Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Historical Audit Log (Google Sheets)</h3>
                <p className="text-[11px] text-slate-500">Real-time spreadsheet backup for HR audit compliance</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px] mb-1">
                  Google Sheet Master Log Spreadsheet ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="Enter Google Spreadsheet ID..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 text-xs"
                  />
                  <button
                    onClick={() => updateSettings({ linkedGoogleSheetId: sheetIdInput })}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleCreateMasterSheet}
                  disabled={isCreatingMasterSheet}
                  className="w-full py-2 bg-green-50 border border-green-300 text-green-800 hover:bg-green-100 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isCreatingMasterSheet ? 'Creating Spreadsheet...' : 'Create / Initialize Master Sheet in Drive'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 text-slate-900"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold">Create User Profile</h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Full Display Name *</label>
                  <input
                    type="text"
                    required
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Thapa"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. ramesh"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="ramesh@gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">System Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold bg-white text-xs"
                  >
                    <option value="employee">Employee (View status & apply)</option>
                    <option value="coordinator">Leave Coordinator (Verify & forward)</option>
                    <option value="dcd">Deputy Country Director (DCD)</option>
                    <option value="cd">Country Director (CD)</option>
                    <option value="admin">HR Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Job Title</label>
                  <input
                    type="text"
                    value={newUserJobTitle}
                    onChange={(e) => setNewUserJobTitle(e.target.value)}
                    placeholder="e.g. Program Officer"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Department</label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    placeholder="e.g. Programs"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Phone Number</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+977-98XXXXXXXX"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Initial Password</label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {isCreatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
