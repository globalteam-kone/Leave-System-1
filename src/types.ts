export type Role = 'employee' | 'coordinator' | 'dcd' | 'cd' | 'admin' | 'hr';

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Maternity/Paternity' | 'Unpaid Leave' | 'Emergency Leave';

export type WorkflowMode = 'digital' | 'paperback';

export type LeaveStatus = 
  | 'draft'
  | 'pending_coordinator'    // Submitted by employee, waiting for coordinator verification
  | 'pending_dcd'            // Verified by coordinator, waiting for Deputy Country Director approval
  | 'pending_cd'             // Approved by DCD, waiting for Country Director final approval
  | 'pending_upload_scanned' // For paperback: In-person signatures obtained, waiting for coordinator to upload signed paper copy
  | 'approved'               // Final approval complete! Balance deducted, Google Calendar sync done, Google Sheet logged
  | 'rejected'               // Rejected by coordinator, DCD, or CD
  | 'cancelled';             // Cancelled by employee

export interface UserProfile {
  id: string; // Firebase Auth UID or system id
  email: string;
  username?: string;
  displayName: string;
  role: Role;
  jobTitle: string;
  department: string;
  phoneNumber?: string;
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    emergency: number;
    unpaidTaken: number;
  };
  signatureUrl?: string; // Digital signature representation / signature image
  createdAt: string;
}

export interface LeaveRequestHistoryLog {
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: 'submit' | 'verify' | 'dcd_approve' | 'cd_approve' | 'reject' | 'upload_scanned_paper' | 'cancel' | 'override_approve';
  notes?: string;
  signature?: string; // e-signature timestamp or marker
}

export interface LeaveAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // Base64 or Drive file URL
  googleDriveFileId?: string;
  googleDriveWebViewLink?: string;
  isScannedForm?: boolean;
}

export interface LeaveRequest {
  id: string;
  trackingNumber: string; // e.g. LR-2026-0012
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  employeeJobTitle: string;
  
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  contactDuringLeave?: string;
  handoverPerson?: string;
  handoverNotes?: string;

  workflowMode: WorkflowMode; // 'digital' or 'paperback' (locked at creation time)
  status: LeaveStatus;

  // Signatures and approvals metadata
  employeeSignature?: {
    signedAt: string;
    signeeName: string;
  };
  coordinatorVerification?: {
    verifiedAt: string;
    coordinatorId: string;
    coordinatorName: string;
    notes?: string;
    paperReceived?: boolean; // For paperback workflow
  };
  dcdApproval?: {
    approvedAt: string;
    dcdId: string;
    dcdName: string;
    comments?: string;
    signatureUrl?: string;
    isPaperSigned?: boolean;
  };
  cdApproval?: {
    approvedAt: string;
    cdId: string;
    cdName: string;
    comments?: string;
    signatureUrl?: string;
    isPaperSigned?: boolean;
  };
  rejectionInfo?: {
    rejectedAt: string;
    rejectedBy: string;
    rejectedByName: string;
    rejectedRole: Role;
    reason: string;
  };

  // Google Workspace Integration Tracking
  attachments: LeaveAttachment[];
  googleCalendarEventId?: string;
  googleCalendarEventLink?: string;
  googleSheetRowLogged?: boolean;
  googleSheetRowIndex?: number;

  history: LeaveRequestHistoryLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultWorkflowMode: WorkflowMode;
  allowPaperbackMode: boolean;
  organizationName: string;
  countryOffice: string;
  linkedGoogleDriveFolderId?: string;
  linkedGoogleDriveFolderName?: string;
  linkedGoogleSheetId?: string;
  linkedGoogleSheetName?: string;
  googleCalendarId?: string; // 'primary' or specific shared calendar
  autoDeductBalance: boolean;
  autoSyncCalendar: boolean;
  autoSyncSheets: boolean;
}
