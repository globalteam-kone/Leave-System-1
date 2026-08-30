import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  FileText, 
  Printer, 
  UploadCloud, 
  Calendar, 
  Sparkles, 
  Paperclip, 
  Clock, 
  ShieldAlert, 
  Download, 
  PenTool, 
  ExternalLink,
  Info,
  Check,
  Eye,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { LeaveRequest, Role } from '../types';
import { WorkflowStepper } from './WorkflowStepper';
import { LeavePrintSlip } from './LeavePrintSlip';

interface LeaveDetailModalProps {
  request: LeaveRequest | null;
  onClose: () => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({ request, onClose }) => {
  const { 
    currentUser, 
    coordinatorVerify, 
    dcdApprove, 
    cdApprove, 
    coordinatorUploadScannedPaper, 
    rejectRequest,
    cancelRequest
  } = useAuth();

  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [scannedFilePreview, setScannedFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!request || !currentUser) return null;

  const role = currentUser.role;
  const status = request.status;
  const isPaper = request.workflowMode === 'paperback';

  // Determine current user's available action
  const canCoordinatorVerify = (role === 'coordinator' || role === 'admin') && status === 'pending_coordinator';
  const canDCDApprove = (role === 'dcd' || role === 'admin') && status === 'pending_dcd';
  const canCDApprove = (role === 'cd' || role === 'admin') && status === 'pending_cd';
  const canCoordinatorUploadScan = (role === 'coordinator' || role === 'admin') && status === 'pending_upload_scanned';
  const canEmployeeCancel = (request.employeeId === currentUser.id || role === 'admin') && 
    (status === 'pending_coordinator' || status === 'pending_dcd');

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const handleCoordinatorVerify = async () => {
    setIsProcessing(true);
    const res = await coordinatorVerify(request.id, comments);
    setIsProcessing(false);
    if (res.success) {
      setActionSuccessMsg('Request verified successfully and forwarded to Deputy Country Director (DCD).');
    }
  };

  const handleDCDApprove = async () => {
    setIsProcessing(true);
    const res = await dcdApprove(request.id, comments);
    setIsProcessing(false);
    if (res.success) {
      setActionSuccessMsg('Deputy Country Director approval recorded. Forwarded to Country Director (CD).');
    }
  };

  const handleCDApprove = async () => {
    setIsProcessing(true);
    const res = await cdApprove(request.id, comments);
    setIsProcessing(false);
    if (res.success) {
      if (!isPaper) {
        triggerCelebration();
        setActionSuccessMsg('Country Director final approval complete! Leave balance deducted & Google Calendar synced.');
      } else {
        setActionSuccessMsg('Country Director physical signature recorded. Forwarded to Coordinator for scan upload.');
      }
    }
  };

  const handleScannedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScannedFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoordinatorUploadScan = async () => {
    if (!scannedFilePreview) {
      alert('Please upload or take a photo of the signed physical paper slip first.');
      return;
    }
    setIsProcessing(true);
    const res = await coordinatorUploadScannedPaper(request.id, scannedFilePreview, comments);
    setIsProcessing(false);
    if (res.success) {
      triggerCelebration();
      setActionSuccessMsg('Scanned physical slip stored to Google Drive, leave balance deducted, and Google Calendar entry created!');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this leave application.');
      return;
    }
    setIsProcessing(true);
    const res = await rejectRequest(request.id, rejectionReason);
    setIsProcessing(false);
    if (res.success) {
      setShowRejectBox(false);
      setActionSuccessMsg('Leave application has been rejected.');
    }
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to withdraw and cancel this leave request?')) {
      setIsProcessing(true);
      await cancelRequest(request.id);
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white">
                    Leave Request: <span className="font-mono text-blue-300">{request.trackingNumber}</span>
                  </h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isPaper
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-blue-400 text-blue-950'
                    }`}
                  >
                    {isPaper ? 'Paperback' : 'Digital Fast-Track'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Employee: <span className="text-slate-200 font-semibold">{request.employeeName}</span> ({request.employeeDepartment})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintSlip(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {actionSuccessMsg && (
            <div className="px-5 py-2.5 bg-green-50 border-b border-green-200 text-green-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Real-time Visual Workflow Stepper */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <WorkflowStepper request={request} />
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Employee Information
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Staff Name:</span>
                    <span className="font-bold text-slate-900">{request.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Department:</span>
                    <span className="font-semibold text-slate-800">{request.employeeDepartment}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Designation:</span>
                    <span className="font-semibold text-slate-800">{request.employeeJobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Official Email:</span>
                    <span className="font-mono text-slate-700 text-[11px]">{request.employeeEmail}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-blue-50/30 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-blue-900 tracking-wider block">
                  Leave Specification
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Category:</span>
                    <span className="font-bold text-slate-900">{request.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Days:</span>
                    <span className="font-bold text-blue-700 font-mono text-sm">{request.totalDays} Day(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Inclusive Dates:</span>
                    <span className="font-semibold text-slate-900">{request.startDate} → {request.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Handover Staff:</span>
                    <span className="font-semibold text-slate-800">{request.handoverPerson || 'None specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Reason */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1">
                Statement of Reason / Justification
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {request.reason}
              </p>
              {request.handoverNotes && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Handover Notes: </span>
                  {request.handoverNotes}
                </div>
              )}
            </div>

            {/* Google Workspace & Drive Status Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Google Workspace Synchronizations
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${request.googleCalendarEventId ? 'bg-green-500' : 'bg-slate-300'}`} />
                    Calendar Sync: {request.googleCalendarEventId ? 'Synced (Event Created)' : 'Awaiting Final Approval'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${request.googleSheetRowLogged ? 'bg-green-500' : 'bg-slate-300'}`} />
                    Google Sheets Log: {request.googleSheetRowLogged ? 'Appended' : 'Pending Approval'}
                  </span>
                </div>
              </div>

              {request.googleCalendarEventLink && (
                <a
                  href={request.googleCalendarEventLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Calendar</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>

            {/* Supporting Attachments & Scanned Documents (Google Drive) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  Google Drive Storage Files ({request.attachments?.length || 0})
                </span>
                <span className="text-[11px] text-slate-500">
                  Stored on Office Drive Storage
                </span>
              </div>

              {request.attachments && request.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {request.attachments.map((att) => (
                    <div
                      key={att.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        att.isScannedForm
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate max-w-[75%]">
                        <FileText className={`w-4 h-4 shrink-0 ${att.isScannedForm ? 'text-amber-700' : 'text-blue-600'}`} />
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 truncate">{att.name}</p>
                          <span className="text-[10px] text-slate-500">
                            {att.isScannedForm ? '📄 Official Scanned Paper Slip' : 'Supporting Doc'}
                          </span>
                        </div>
                      </div>
                      {att.dataUrl && (
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 shadow-2xs"
                          title="View / Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No additional supporting documents attached.
                </div>
              )}
            </div>

            {/* Audit Logs & Signatures Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Verification & Signature Audit Log
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {request.history.map((log, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {log.actorName} <span className="font-normal text-slate-500 uppercase text-[10px]">({log.actorRole})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">{log.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION SECTION - ROLE BASED CONTROLS */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              {/* Coordinator Verification Block */}
              {canCoordinatorVerify && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Coordinator Action: Verify Leave Request</span>
                    </div>
                    {isPaper && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        Paperback Mode: Verify Physical Employee Signature
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Add verification notes or leave balance check confirmation..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowRejectBox(true)}
                      className="px-3.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleCoordinatorVerify}
                      disabled={isProcessing}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Verify & Forward to DCD</span>
                    </button>
                  </div>
                </div>
              )}

              {/* DCD Approval Block */}
              {canDCDApprove && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      <span>Deputy Country Director (DCD): Review & Recommendation</span>
                    </div>
                    {isPaper && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        Paperback: In-person form presented by Coordinator
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter DCD comments / recommendations..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowRejectBox(true)}
                      className="px-3.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleDCDApprove}
                      disabled={isProcessing}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isPaper ? 'Confirm DCD Physical Signature → Forward to CD' : 'DCD E-Sign & Forward to CD'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Country Director (CD) Final Approval Block */}
              {canCDApprove && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Country Director (CD): Final Approval Authority</span>
                    </div>
                    {isPaper && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                        Paperback: Executive In-Person Sign-off
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter CD approval remarks..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowRejectBox(true)}
                      className="px-3.5 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleCDApprove}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isPaper ? 'Confirm CD Physical Signature' : 'Grant Final CD Approval & Deduct Balance'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Paperback Mode - Step 5: Coordinator Upload Scanned Paper Slip */}
              {canCoordinatorUploadScan && (
                <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                    <UploadCloud className="w-5 h-5 text-amber-700" />
                    <span>Coordinator Action: Upload Scanned Physical Signed Form</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Both DCD and Country Director have signed the physical paper slip. Please scan or photograph the fully signed document to archive in Google Drive and finalize the leave deduction.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="cursor-pointer px-3.5 py-1.5 bg-white border border-amber-400 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100 flex items-center gap-2 shadow-2xs">
                      <UploadCloud className="w-4 h-4 text-amber-700" />
                      <span>Choose Scanned Slip File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleScannedFileUpload}
                        className="hidden"
                      />
                    </label>

                    {scannedFilePreview ? (
                      <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" /> Scanned file ready for Drive archive
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No scanned document selected yet</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      onClick={handleCoordinatorUploadScan}
                      disabled={isProcessing || !scannedFilePreview}
                      className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Upload to Drive & Finalize Approval</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Employee Cancellation Action */}
              {canEmployeeCancel && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>Need to make changes or withdraw this leave?</span>
                  <button
                    onClick={handleCancel}
                    className="text-red-600 hover:text-red-700 font-semibold underline"
                  >
                    Withdraw & Cancel Request
                  </button>
                </div>
              )}
            </div>

            {/* Rejection Prompt Modal Box */}
            {showRejectBox && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-3">
                <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Specify Reason for Rejection
                </span>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Critical project deadline on selected dates, insufficient coverage, please reschedule..."
                  className="w-full p-2.5 bg-white border border-red-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-400"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowRejectBox(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Printable Slip Overlay */}
      {showPrintSlip && (
        <LeavePrintSlip
          request={request}
          onClose={() => setShowPrintSlip(false)}
        />
      )}
    </>
  );
};
