import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock, FileText, Send, UserCheck, ShieldAlert, ArrowRight, Printer, UploadCloud } from 'lucide-react';
import { LeaveRequest, LeaveStatus } from '../types';

interface WorkflowStepperProps {
  request: LeaveRequest;
  compact?: boolean;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ request, compact = false }) => {
  const isPaper = request.workflowMode === 'paperback';
  const status = request.status;

  // Define steps based on digital vs paperback
  const digitalSteps = [
    {
      id: 'step_submit',
      title: 'Submission',
      subtitle: 'Employee Sign-off',
      actor: request.employeeName,
      done: true,
      active: status === 'draft',
      icon: Send,
    },
    {
      id: 'step_coord',
      title: 'Coordinator Verification',
      subtitle: 'Balance & Eligibility',
      actor: request.coordinatorVerification?.coordinatorName || 'Leave Coordinator',
      done: status !== 'pending_coordinator' && status !== 'draft',
      active: status === 'pending_coordinator',
      icon: UserCheck,
    },
    {
      id: 'step_dcd',
      title: 'DCD Approval',
      subtitle: 'Deputy Country Dir',
      actor: request.dcdApproval?.dcdName || 'Deputy Country Director',
      done: status === 'pending_cd' || status === 'approved',
      active: status === 'pending_dcd',
      icon: CheckCircle2,
    },
    {
      id: 'step_cd',
      title: 'CD Final Approval',
      subtitle: 'Country Director',
      actor: request.cdApproval?.cdName || 'Country Director',
      done: status === 'approved',
      active: status === 'pending_cd',
      icon: CheckCircle2,
    },
  ];

  const paperbackSteps = [
    {
      id: 'step_submit',
      title: 'Paperback Slip',
      subtitle: 'Print & Employee Sign',
      actor: request.employeeName,
      done: true,
      active: status === 'draft',
      icon: Printer,
    },
    {
      id: 'step_coord_inperson',
      title: 'Coordinator Check',
      subtitle: 'In-person Verification',
      actor: request.coordinatorVerification?.coordinatorName || 'Leave Coordinator',
      done: status !== 'pending_coordinator' && status !== 'draft',
      active: status === 'pending_coordinator',
      icon: UserCheck,
    },
    {
      id: 'step_dcd_paper',
      title: 'DCD Physical Sign',
      subtitle: 'In-person Ink Sign-off',
      actor: request.dcdApproval?.dcdName || 'Deputy Country Director',
      done: status === 'pending_cd' || status === 'pending_upload_scanned' || status === 'approved',
      active: status === 'pending_dcd',
      icon: FileText,
    },
    {
      id: 'step_cd_paper',
      title: 'CD Physical Sign',
      subtitle: 'Executive Ink Sign-off',
      actor: request.cdApproval?.cdName || 'Country Director',
      done: status === 'pending_upload_scanned' || status === 'approved',
      active: status === 'pending_cd',
      icon: FileText,
    },
    {
      id: 'step_scan_upload',
      title: 'Scan Upload & Sync',
      subtitle: 'Drive Archive & Finalize',
      actor: request.coordinatorVerification?.coordinatorName || 'Leave Coordinator',
      done: status === 'approved',
      active: status === 'pending_upload_scanned',
      icon: UploadCloud,
    },
  ];

  const steps = isPaper ? paperbackSteps : digitalSteps;

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        {steps.map((step, idx) => {
          const isCurrent = step.active;
          const isDone = step.done && !isCurrent;
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                  status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-200 animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}
                title={`${step.title}: ${step.actor}`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-2.5 h-0.5 ${
                    isDone ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full py-3 px-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isPaper
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-blue-100 text-blue-900 border border-blue-300'
            }`}
          >
            {isPaper ? '📄 Paperback Process' : '⚡ Digital Fast-Track'}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {request.trackingNumber}
          </span>
        </div>
        {status === 'rejected' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Rejected
          </span>
        )}
        {status === 'approved' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved & Synced
          </span>
        )}
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = step.active && status !== 'rejected';
            const isDone = step.done && !isCurrent && status !== 'rejected';
            const isRejected = status === 'rejected' && step.active;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100 shadow-2xs'
                    : isDone
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : isRejected
                    ? 'bg-red-50 border-red-300'
                    : 'bg-slate-50/80 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : isRejected
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Step {idx + 1}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {step.subtitle}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 truncate max-w-[110px]">
                    {step.actor}
                  </span>
                  <span
                    className={`font-semibold ${
                      isDone
                        ? 'text-emerald-700'
                        : isCurrent
                        ? 'text-blue-700 font-bold'
                        : isRejected
                        ? 'text-red-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {isDone ? 'Completed' : isCurrent ? 'Action Needed' : isRejected ? 'Declined' : 'Pending'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
