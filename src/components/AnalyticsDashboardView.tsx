import React from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  Sparkles,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest, LeaveType } from '../types';

export const AnalyticsDashboardView: React.FC = () => {
  const { leaveRequests, allUsers } = useAuth();

  // Basic Metrics
  const totalRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved').length;
  const pendingRequests = leaveRequests.filter(r => 
    r.status === 'pending_coordinator' || 
    r.status === 'pending_dcd' || 
    r.status === 'pending_cd' || 
    r.status === 'pending_upload_scanned'
  ).length;
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected').length;

  const digitalRequestsCount = leaveRequests.filter(r => r.workflowMode === 'digital').length;
  const paperRequestsCount = leaveRequests.filter(r => r.workflowMode === 'paperback').length;

  // Breakdown by leave types
  const typeCounts: Record<LeaveType, number> = {
    'Annual Leave': 0,
    'Sick Leave': 0,
    'Casual Leave': 0,
    'Emergency Leave': 0,
    'Maternity/Paternity': 0,
    'Unpaid Leave': 0,
  };

  leaveRequests.forEach(r => {
    if (typeCounts[r.leaveType] !== undefined) {
      typeCounts[r.leaveType] += r.totalDays;
    }
  });

  // Department Breakdown
  const deptDays: Record<string, number> = {};
  leaveRequests.forEach(r => {
    const dept = r.employeeDepartment || 'General';
    deptDays[dept] = (deptDays[dept] || 0) + r.totalDays;
  });

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Tracking ID', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Mode', 'Status', 'Applied At'];
    const rows = leaveRequests.map(r => [
      r.trackingNumber,
      `"${r.employeeName}"`,
      `"${r.employeeDepartment}"`,
      `"${r.leaveType}"`,
      r.startDate,
      r.endDate,
      r.totalDays,
      r.workflowMode,
      r.status,
      new Date(r.createdAt).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leave_Management_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Export */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-900">Leave Balance Analytics & Historical Reports</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Real-time organizational leave utilization, mode adoption rates, and departmental breakdown.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Historical CSV</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Total Applications</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalRequests}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">All recorded workflows</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-green-700 font-semibold uppercase tracking-wider block">Approved & Calendar Synced</span>
          <div className="text-2xl font-black text-green-800 mt-1 font-mono">{approvedRequests}</div>
          <span className="text-[10px] text-green-700/80 mt-0.5 block">
            {totalRequests > 0 ? `${Math.round((approvedRequests / totalRequests) * 100)}% approval rate` : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider block">Active In-Pipeline</span>
          <div className="text-2xl font-black text-blue-800 mt-1 font-mono">{pendingRequests}</div>
          <span className="text-[10px] text-blue-700/80 mt-0.5 block">Coordinator / DCD / CD stages</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-purple-700 font-semibold uppercase tracking-wider block">Digital Adoption Ratio</span>
          <div className="text-2xl font-black text-purple-800 mt-1 font-mono">
            {totalRequests > 0 ? `${Math.round((digitalRequestsCount / totalRequests) * 100)}%` : '100%'}
          </div>
          <span className="text-[10px] text-purple-700/80 mt-0.5 block">
            {digitalRequestsCount} Digital vs {paperRequestsCount} Paperback
          </span>
        </div>
      </div>

      {/* Analytical Breakdown Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave Category Utilization */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <PieIcon className="w-4 h-4 text-blue-600" />
              Total Leave Days Taken by Category
            </h2>
          </div>

          <div className="space-y-2.5 pt-1">
            {(Object.entries(typeCounts) as [LeaveType, number][]).map(([type, days]) => {
              const maxVal = Math.max(...Object.values(typeCounts), 10);
              const percentage = Math.min(100, Math.round((days / maxVal) * 100));

              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 text-[11px]">{type}</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">{days} Day(s)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Departmental Leave Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
          <h2 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4 h-4 text-green-600" />
            Departmental Absence Days
          </h2>

          <div className="space-y-2.5 pt-1">
            {Object.keys(deptDays).length > 0 ? (
              Object.entries(deptDays).map(([dept, days]) => {
                const maxDept = Math.max(...Object.values(deptDays), 10);
                const pct = Math.min(100, Math.round((days / maxDept) * 100));
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 text-[11px]">{dept}</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">{days} Total Days</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-green-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No departmental leave history logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Leave Balances Overview */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Individual Employee Leave Balances Registry
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Annual (Days)</th>
                <th className="p-3 text-center">Sick (Days)</th>
                <th className="p-3 text-center">Casual (Days)</th>
                <th className="p-3 text-center">Emergency (Days)</th>
                <th className="p-3 text-center">Unpaid Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">
                    {user.displayName}
                    <span className="block text-[10px] text-slate-400 font-normal">{user.jobTitle}</span>
                  </td>
                  <td className="p-3 text-slate-600">{user.department}</td>
                  <td className="p-3 text-center font-bold text-blue-700 font-mono">{user.leaveBalance.annual}</td>
                  <td className="p-3 text-center font-bold text-rose-700 font-mono">{user.leaveBalance.sick}</td>
                  <td className="p-3 text-center font-bold text-amber-700 font-mono">{user.leaveBalance.casual}</td>
                  <td className="p-3 text-center font-bold text-purple-700 font-mono">{user.leaveBalance.emergency}</td>
                  <td className="p-3 text-center font-bold text-slate-500 font-mono">{user.leaveBalance.unpaidTaken || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
