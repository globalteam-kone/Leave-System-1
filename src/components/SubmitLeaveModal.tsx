import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Calendar, 
  Clock, 
  FileText, 
  UserCheck, 
  Paperclip, 
  AlertCircle, 
  FileCheck, 
  Layers, 
  Sparkles, 
  Printer, 
  UploadCloud, 
  X, 
  Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LeaveType, WorkflowMode } from '../types';

interface SubmitLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
}

export const SubmitLeaveModal: React.FC<SubmitLeaveModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, createLeaveRequest, appSettings } = useAuth();

  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [contactDuringLeave, setContactDuringLeave] = useState(currentUser?.phoneNumber || '');
  const [handoverPerson, setHandoverPerson] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [selectedWorkflowMode, setSelectedWorkflowMode] = useState<WorkflowMode>(appSettings.defaultWorkflowMode);
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; dataUrl: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  // Calculate working days between dates
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (d2 < d1) return 0;

    let count = 0;
    const cur = new Date(d1);
    while (cur <= d2) {
      const dayOfWeek = cur.getDay();
      // Skip Saturday (6) and Sunday (0) for official working days calculation
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count === 0 ? 1 : count;
  };

  const calculatedDays = calculateDays(startDate, endDate);

  // Available leave balances
  const getAvailableBalance = (type: LeaveType): number => {
    switch (type) {
      case 'Annual Leave': return currentUser.leaveBalance.annual;
      case 'Sick Leave': return currentUser.leaveBalance.sick;
      case 'Casual Leave': return currentUser.leaveBalance.casual;
      case 'Emergency Leave': return currentUser.leaveBalance.emergency;
      default: return 99; // Unpaid / Special
    }
  };

  const availableBalance = getAvailableBalance(leaveType);
  const isBalanceExceeded = leaveType !== 'Unpaid Leave' && calculatedDays > availableBalance;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string,
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg('Please fill in start date, end date, and reason for leave.');
      return;
    }
    if (calculatedDays <= 0) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createLeaveRequest({
      leaveType,
      startDate,
      endDate,
      totalDays: calculatedDays,
      reason,
      contactDuringLeave,
      handoverPerson,
      handoverNotes,
      workflowMode: selectedWorkflowMode,
      attachments,
    });

    setIsSubmitting(false);

    if (res.success && res.request) {
      if (onSuccess) onSuccess(res.request.id);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to submit leave request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Submit Leave Application</h2>
              <p className="text-[11px] text-slate-400">
                Staff: <span className="font-semibold text-slate-200">{currentUser.displayName}</span> ({currentUser.department})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-900">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Workflow Mode Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Application Workflow Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => setSelectedWorkflowMode('digital')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  selectedWorkflowMode === 'digital'
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    ⚡ Digital Fast-Track
                  </span>
                  {selectedWorkflowMode === 'digital' && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  100% paperless approval. Coordinator verifies online → DCD e-signs → CD e-signs → Auto Calendar Sync.
                </p>
              </div>

              <div 
                onClick={() => setSelectedWorkflowMode('paperback')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  selectedWorkflowMode === 'paperback'
                    ? 'border-amber-600 bg-amber-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-amber-600" />
                    📄 Paperback Slip Mode
                  </span>
                  {selectedWorkflowMode === 'paperback' && (
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Print physical slip → Hand to Coordinator → In-person DCD/CD ink sign → Upload scanned copy.
                </p>
              </div>
            </div>
          </div>

          {/* Leave Type & Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Leave Category *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="Annual Leave">Annual Leave ({currentUser.leaveBalance.annual} days remaining)</option>
                <option value="Sick Leave">Sick Leave ({currentUser.leaveBalance.sick} days remaining)</option>
                <option value="Casual Leave">Casual Leave ({currentUser.leaveBalance.casual} days remaining)</option>
                <option value="Emergency Leave">Emergency Leave ({currentUser.leaveBalance.emergency} days remaining)</option>
                <option value="Maternity/Paternity">Maternity/Paternity Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Available Remaining Balance
              </label>
              <div className={`px-3 py-2 rounded-lg border flex items-center justify-between text-xs font-bold ${
                isBalanceExceeded ? 'bg-red-50 border-red-300 text-red-800' : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}>
                <span>{leaveType}:</span>
                <span className="font-mono text-emerald-700">{availableBalance} Days Left</span>
              </div>
            </div>
          </div>

          {/* Date Picker Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Working Days
              </label>
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center font-mono ${
                calculatedDays > 0 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {calculatedDays} Work Day(s)
              </div>
            </div>
          </div>

          {isBalanceExceeded && (
            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Notice: Requested {calculatedDays} days exceeds current {leaveType} balance ({availableBalance} days). Excess may require HR/Director special approval.
            </p>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Reason for Leave & Specific Remarks *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending family wedding in Pokhara; urgent personal administrative tasks; medical rest..."
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Handover & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Work Handover Colleague
              </label>
              <input
                type="text"
                value={handoverPerson}
                onChange={(e) => setHandoverPerson(e.target.value)}
                placeholder="e.g. Sunita Lama / Aarav K.C."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Emergency Contact Phone
              </label>
              <input
                type="text"
                value={contactDuringLeave}
                onChange={(e) => setContactDuringLeave(e.target.value)}
                placeholder="+977-98XXXXXXXX"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Google Drive Linked Supporting Documents */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                Google Drive Supporting Documents
              </label>
              <span className="text-[10px] text-slate-500">
                Auto-saved to linked office drive
              </span>
            </div>

            <div className="border border-dashed border-slate-300 rounded-lg p-2.5 bg-slate-50 flex flex-col items-center justify-center text-center">
              <input
                type="file"
                multiple
                id="doc-upload"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <label
                htmlFor="doc-upload"
                className="cursor-pointer px-3.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                Choose File(s) or Drag Here
              </label>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Attach doctor notes, travel tickets (Max 10MB each)
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[80%]">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-medium text-slate-800">{att.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({Math.round(att.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit {selectedWorkflowMode === 'paperback' ? 'Paperback Request' : 'Digital Request'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
