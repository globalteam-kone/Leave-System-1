import React, { useRef } from 'react';
import { Printer, Download, Building2, CheckSquare, Calendar, User, ShieldCheck } from 'lucide-react';
import { LeaveRequest } from '../types';

interface LeavePrintSlipProps {
  request: LeaveRequest;
  onClose?: () => void;
}

export const LeavePrintSlip: React.FC<LeavePrintSlipProps> = ({ request, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-zinc-200">
        {/* Modal Toolbar - Hidden during print */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm tracking-wide">
              Official Physical Leave Application Slip (Paperback Format)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Printable Form Content */}
        <div ref={printRef} className="p-8 overflow-y-auto bg-white text-zinc-900 font-sans space-y-6">
          {/* Header */}
          <div className="border-b-2 border-zinc-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-zinc-800" />
                <h1 className="text-xl font-black uppercase tracking-wider text-zinc-900">
                  Country Office Program
                </h1>
              </div>
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mt-0.5">
                Human Resources & Operations Department
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block border border-zinc-900 px-3 py-1 text-xs font-mono font-bold bg-zinc-50">
                {request.trackingNumber}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Date: {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-center py-1 bg-zinc-100 border border-zinc-300 rounded font-bold uppercase tracking-widest text-xs">
            Official Employee Leave Application Form (Paperback Verification)
          </div>

          {/* Section 1: Employee Particulars */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b pb-1">
              1. Employee Particulars
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-zinc-500 font-medium">Employee Name:</span>
                <span className="font-bold text-zinc-900">{request.employeeName}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Job Title:</span>
                <span className="font-semibold text-zinc-800">{request.employeeJobTitle}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Department:</span>
                <span className="font-semibold text-zinc-800">{request.employeeDepartment}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Email Address:</span>
                <span className="font-mono text-zinc-800">{request.employeeEmail}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Emergency Contact:</span>
                <span className="font-semibold text-zinc-800">{request.contactDuringLeave || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Work Handover To:</span>
                <span className="font-semibold text-zinc-800">{request.handoverPerson || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Leave Details */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b pb-1">
              2. Leave Category & Schedule
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              <div>
                <span className="block text-zinc-500 font-medium">Type of Leave:</span>
                <span className="font-black text-indigo-900">{request.leaveType}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">From Date:</span>
                <span className="font-bold text-zinc-900">{request.startDate}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">To Date:</span>
                <span className="font-bold text-zinc-900">{request.endDate}</span>
              </div>
              <div>
                <span className="block text-zinc-500 font-medium">Total Duration:</span>
                <span className="font-black text-zinc-900 text-sm">{request.totalDays} Work Day(s)</span>
              </div>
            </div>

            <div className="text-xs mt-2">
              <span className="block text-zinc-500 font-medium mb-1">Reason / Remarks:</span>
              <div className="p-2.5 bg-white border border-zinc-300 rounded text-zinc-800 min-h-[45px]">
                {request.reason}
              </div>
            </div>
          </div>

          {/* Section 3: Physical Signatures & Approvals Matrix */}
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 border-b pb-1">
              3. Verification & Approval Signatures (Paperback Chain)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Employee Signature */}
              <div className="border border-zinc-300 rounded-lg p-3 flex flex-col justify-between h-36 bg-zinc-50/50">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    A. Employee Signature
                  </span>
                  <p className="text-[11px] font-medium text-zinc-800 mt-1">
                    {request.employeeName}
                  </p>
                </div>
                <div className="border-t border-dashed border-zinc-400 pt-1 text-center">
                  <span className="font-serif italic text-zinc-700 font-bold">
                    {request.employeeSignature?.signeeName || request.employeeName}
                  </span>
                  <p className="text-[9px] text-zinc-400">
                    Date: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Coordinator Verification */}
              <div className="border border-zinc-300 rounded-lg p-3 flex flex-col justify-between h-36 bg-zinc-50/50">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    B. Leave Coordinator
                  </span>
                  <p className="text-[11px] font-medium text-zinc-800 mt-1">
                    {request.coordinatorVerification?.coordinatorName || 'Operations Coordinator'}
                  </p>
                </div>
                <div className="border-t border-dashed border-zinc-400 pt-1 text-center">
                  {request.coordinatorVerification ? (
                    <>
                      <span className="font-serif italic text-emerald-700 font-bold">
                        ✓ Verified & Endorsed
                      </span>
                      <p className="text-[9px] text-zinc-500">
                        Date: {new Date(request.coordinatorVerification.verifiedAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="h-6 flex items-center justify-center text-[10px] text-zinc-400 italic">
                      [ Physical Sign & Stamp ]
                    </div>
                  )}
                </div>
              </div>

              {/* DCD Approval */}
              <div className="border border-zinc-300 rounded-lg p-3 flex flex-col justify-between h-36 bg-zinc-50/50">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    C. Deputy Country Director
                  </span>
                  <p className="text-[11px] font-medium text-zinc-800 mt-1">
                    {request.dcdApproval?.dcdName || 'Deputy Country Director'}
                  </p>
                </div>
                <div className="border-t border-dashed border-zinc-400 pt-1 text-center">
                  {request.dcdApproval ? (
                    <>
                      <span className="font-serif italic text-indigo-700 font-bold">
                        ✓ Recommended & Signed
                      </span>
                      <p className="text-[9px] text-zinc-500">
                        Date: {new Date(request.dcdApproval.approvedAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="h-6 flex items-center justify-center text-[10px] text-zinc-400 italic">
                      [ In-Person Physical Sign ]
                    </div>
                  )}
                </div>
              </div>

              {/* CD Final Approval */}
              <div className="border border-zinc-300 rounded-lg p-3 flex flex-col justify-between h-36 bg-zinc-50/50">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    D. Country Director
                  </span>
                  <p className="text-[11px] font-medium text-zinc-800 mt-1">
                    {request.cdApproval?.cdName || 'Country Director'}
                  </p>
                </div>
                <div className="border-t border-dashed border-zinc-400 pt-1 text-center">
                  {request.cdApproval ? (
                    <>
                      <span className="font-serif italic text-emerald-800 font-black">
                        ★ Approved (Final)
                      </span>
                      <p className="text-[9px] text-zinc-500">
                        Date: {new Date(request.cdApproval.approvedAt).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="h-6 flex items-center justify-center text-[10px] text-zinc-400 italic">
                      [ In-Person Executive Sign ]
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Paperback Process Flow Instructions for Staff */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Paperback Workflow Instruction:
            </p>
            <p>
              1. Employee submits request in app, prints this slip, signs Section A, and hands it to the Coordinator.
            </p>
            <p>
              2. Coordinator validates balance in-app & physical slip, then brings paper to DCD for signature in Section C.
            </p>
            <p>
              3. Coordinator brings DCD-signed paper to CD for final signature in Section D.
            </p>
            <p>
              4. Coordinator scans or photographs the completed physical slip, uploads it in the app to archive in Google Drive and finalize approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
