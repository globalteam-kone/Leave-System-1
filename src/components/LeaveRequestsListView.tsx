import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Printer, 
  Layers, 
  FileText, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest, LeaveStatus, WorkflowMode, Role } from '../types';
import { WorkflowStepper } from './WorkflowStepper';

interface LeaveRequestsListViewProps {
  onSelectRequest: (request: LeaveRequest) => void;
  onOpenSubmitModal: () => void;
}

export const LeaveRequestsListView: React.FC<LeaveRequestsListViewProps> = ({ 
  onSelectRequest, 
  onOpenSubmitModal 
}) => {
  const { currentUser, leaveRequests, appSettings } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  if (!currentUser) return null;

  const role = currentUser.role;

  // Filter requests based on user role permissions
  const visibleRequests = leaveRequests.filter(req => {
    if (role === 'employee') {
      return req.employeeId === currentUser.id;
    }
    return true;
  });

  // Apply filters & search
  const filteredRequests = visibleRequests.filter(req => {
    const matchesSearch = 
      req.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employeeDepartment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesMode = modeFilter === 'all' || req.workflowMode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  // Calculate quick badge status
  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">✓ Approved & Synced</span>;
      case 'pending_coordinator':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Pending Coordinator</span>;
      case 'pending_dcd':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Pending DCD Approval</span>;
      case 'pending_cd':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Pending CD Approval</span>;
      case 'pending_upload_scanned':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">Needs Scanned Slip</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">Rejected</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* High Density Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'employee' ? (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Annual Balance</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{currentUser.leaveBalance.annual}</span>
                <span className="text-xs text-blue-600 font-semibold">Days Available</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sick Balance</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{currentUser.leaveBalance.sick}</span>
                <span className="text-xs text-rose-600 font-semibold">Days Available</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Casual / Emergency</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {currentUser.leaveBalance.casual + currentUser.leaveBalance.emergency}
                </span>
                <span className="text-xs text-amber-600 font-semibold">Days Combined</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">My Submissions</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">{visibleRequests.length}</span>
                <span className="text-xs text-slate-500 font-semibold">Total Records</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Applications</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {leaveRequests.filter(r => r.status !== 'approved' && r.status !== 'rejected').length}
                </span>
                <span className="text-xs text-blue-600 font-semibold">In Progress</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Coordinator</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {leaveRequests.filter(r => r.status === 'pending_coordinator' || r.status === 'pending_upload_scanned').length}
                </span>
                <span className="text-xs text-amber-600 font-semibold">Needs Review</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Executive Approval</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {leaveRequests.filter(r => r.status === 'pending_dcd' || r.status === 'pending_cd').length}
                </span>
                <span className="text-xs text-indigo-600 font-semibold">DCD / CD</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drive & Calendar Synced</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {leaveRequests.filter(r => r.status === 'approved').length}
                </span>
                <span className="text-xs text-green-600 font-semibold">Approved</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* High Density Filter & Action Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, name, department..."
            className="w-full pl-9 pr-3.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending_coordinator">Pending Coordinator</option>
            <option value="pending_dcd">Pending DCD Approval</option>
            <option value="pending_cd">Pending CD Approval</option>
            <option value="pending_upload_scanned">Pending Scanned Slip</option>
            <option value="approved">Approved & Calendar Synced</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs"
          >
            <option value="all">All Workflows</option>
            <option value="digital">⚡ Digital Fast-Track</option>
            <option value="paperback">📄 Paperback Physical</option>
          </select>

          {/* Quick Submit */}
          <button
            onClick={onOpenSubmitModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition ml-auto md:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Leave</span>
          </button>
        </div>
      </div>

      {/* High Density Table & Stream Card Listing */}
      <div className="space-y-2.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Leave Applications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No leave requests match your search criteria. Submit a new application or clear filters to view existing records.
            </p>
            <button
              onClick={onOpenSubmitModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
            >
              Submit Application
            </button>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPaper = req.workflowMode === 'paperback';

            // Highlighting if action needed by this user
            const isActionRequiredForMe = 
              (role === 'coordinator' && (req.status === 'pending_coordinator' || req.status === 'pending_upload_scanned')) ||
              (role === 'dcd' && req.status === 'pending_dcd') ||
              (role === 'cd' && req.status === 'pending_cd');

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectRequest(req)}
                className={`bg-white rounded-xl p-4 border cursor-pointer transition shadow-2xs hover:shadow-xs hover:border-slate-300 ${
                  isActionRequiredForMe
                    ? 'border-blue-400 ring-2 ring-blue-100/80 bg-blue-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left Meta & Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {req.trackingNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isPaper
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {isPaper ? '📄 Paperback' : '⚡ Digital'}
                      </span>
                      {getStatusBadge(req.status)}
                      {isActionRequiredForMe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          Action Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        {req.employeeName}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {req.employeeDepartment} ({req.employeeJobTitle})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      <span className="font-semibold text-slate-800">{req.leaveType}</span> ({req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}): {req.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {req.startDate} → {req.endDate}
                      </span>
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.googleCalendarEventId && (
                        <span className="text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Calendar Synced
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Workflow Stepper preview */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-2.5 lg:pt-0 border-slate-100">
                    <div className="hidden sm:block">
                      <WorkflowStepper request={req} compact />
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition">
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
