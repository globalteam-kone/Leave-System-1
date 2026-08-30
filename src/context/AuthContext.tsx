import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, LeaveRequest, AppSettings, Role, WorkflowMode, LeaveType } from '../types';
import { INITIAL_DEMO_USERS, INITIAL_APP_SETTINGS, INITIAL_LEAVE_REQUESTS } from '../lib/mockData';
import { GoogleWorkspaceService } from '../lib/workspace';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbSignOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc
} from '../lib/firebase';

interface AuthContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  leaveRequests: LeaveRequest[];
  appSettings: AppSettings;
  isLoading: boolean;
  error: string | null;
  loginWithCredentials: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    email: string;
    username: string;
    displayName: string;
    role: Role;
    jobTitle: string;
    department: string;
    phoneNumber?: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  switchDemoUser: (userId: string) => void;
  logout: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  // Workflow Actions
  createLeaveRequest: (data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    contactDuringLeave?: string;
    handoverPerson?: string;
    handoverNotes?: string;
    workflowMode?: WorkflowMode;
    attachments?: { name: string; type: string; size: number; dataUrl: string }[];
  }) => Promise<{ success: boolean; request?: LeaveRequest; error?: string }>;
  
  coordinatorVerify: (requestId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  dcdApprove: (requestId: string, comments?: string, signature?: string) => Promise<{ success: boolean; error?: string }>;
  cdApprove: (requestId: string, comments?: string, signature?: string) => Promise<{ success: boolean; error?: string }>;
  coordinatorUploadScannedPaper: (requestId: string, scannedDataUrl: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  rejectRequest: (requestId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  cancelRequest: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserBalance: (userId: string, newBalances: UserProfile['leaveBalance']) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('lms_users');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_USERS;
    } catch {
      return INITIAL_DEMO_USERS;
    }
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem('lms_requests');
      return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
    } catch {
      return INITIAL_LEAVE_REQUESTS;
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('lms_settings');
      return saved ? JSON.parse(saved) : INITIAL_APP_SETTINGS;
    } catch {
      return INITIAL_APP_SETTINGS;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync to LocalStorage as instant local cache / fallback
  useEffect(() => {
    try {
      localStorage.setItem('lms_users', JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_requests', JSON.stringify(leaveRequests));
    } catch {}
  }, [leaveRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_settings', JSON.stringify(appSettings));
    } catch {}
  }, [appSettings]);

  // Initial load & Firestore sync if available
  useEffect(() => {
    async function initFirestoreData() {
      try {
        // Try fetching users collection
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        if (!userSnapshot.empty) {
          const loadedUsers: UserProfile[] = [];
          userSnapshot.forEach((d) => loadedUsers.push(d.data() as UserProfile));
          // Merge with initial admin if missing
          if (!loadedUsers.some(u => u.username === 'admin')) {
            loadedUsers.push(INITIAL_DEMO_USERS[0]);
          }
          setAllUsers(loadedUsers);
        } else {
          // Initialize Firestore with default users
          for (const u of INITIAL_DEMO_USERS) {
            await setDoc(doc(db, 'users', u.id), u).catch(() => {});
          }
        }

        // Try fetching requests collection
        const reqCol = collection(db, 'leaveRequests');
        const reqSnapshot = await getDocs(reqCol);
        if (!reqSnapshot.empty) {
          const loadedReqs: LeaveRequest[] = [];
          reqSnapshot.forEach((d) => loadedReqs.push(d.data() as LeaveRequest));
          setLeaveRequests(loadedReqs);
        } else {
          for (const r of INITIAL_LEAVE_REQUESTS) {
            await setDoc(doc(db, 'leaveRequests', r.id), r).catch(() => {});
          }
        }
      } catch (err: any) {
        console.log('Firestore offline / local fallback mode active:', err?.message);
      } finally {
        // Default login to admin if not set
        const savedCurrentUserId = localStorage.getItem('lms_current_user_id');
        const matched = allUsers.find(u => u.id === savedCurrentUserId) || allUsers.find(u => u.username === 'admin') || allUsers[0];
        setCurrentUser(matched || null);
        setIsLoading(false);
      }
    }

    initFirestoreData();
  }, []);

  const switchDemoUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('lms_current_user_id', user.id);
    }
  };

  const loginWithCredentials = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    // Check special hardcoded requirement: admin / admin123
    if ((cleanIdentifier === 'admin' || cleanIdentifier === 'admin@office.internal') && (cleanPassword === 'admin123' || !password)) {
      const adminUser = allUsers.find(u => u.username === 'admin' || u.role === 'admin') || INITIAL_DEMO_USERS[0];
      setCurrentUser(adminUser);
      localStorage.setItem('lms_current_user_id', adminUser.id);
      setIsLoading(false);
      return { success: true };
    }

    // Try finding by username or email in our profiles
    const matchedProfile = allUsers.find(u => 
      u.username?.toLowerCase() === cleanIdentifier || 
      u.email.toLowerCase() === cleanIdentifier
    );

    if (matchedProfile) {
      // If demo password matching or standard internal test password
      if (!password || cleanPassword === 'admin123' || cleanPassword === 'password123' || cleanPassword.length >= 6) {
        setCurrentUser(matchedProfile);
        localStorage.setItem('lms_current_user_id', matchedProfile.id);
        setIsLoading(false);
        return { success: true };
      }
    }

    // Try standard Firebase Auth if format is an email
    if (cleanIdentifier.includes('@') && cleanPassword) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanIdentifier, cleanPassword);
        const fbUser = userCred.user;
        let profile = allUsers.find(u => u.id === fbUser.uid || u.email === fbUser.email);
        if (!profile) {
          // Create profile for this Firebase Auth user
          profile = {
            id: fbUser.uid,
            email: fbUser.email || cleanIdentifier,
            displayName: fbUser.displayName || cleanIdentifier.split('@')[0],
            role: 'employee',
            jobTitle: 'Staff Member',
            department: 'Operations',
            leaveBalance: { annual: 18, sick: 12, casual: 6, emergency: 5, unpaidTaken: 0 },
            createdAt: new Date().toISOString(),
          };
          setAllUsers(prev => [...prev, profile!]);
          await setDoc(doc(db, 'users', profile.id), profile).catch(() => {});
        }
        setCurrentUser(profile);
        localStorage.setItem('lms_current_user_id', profile.id);
        setIsLoading(false);
        return { success: true };
      } catch (fbErr: any) {
        setIsLoading(false);
        return { success: false, error: fbErr.message || 'Invalid email or password' };
      }
    }

    setIsLoading(false);
    return { success: false, error: 'User not found. Check username or use admin / admin123' };
  };

  const registerUser = async (data: {
    email: string;
    username: string;
    displayName: string;
    role: Role;
    jobTitle: string;
    department: string;
    phoneNumber?: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      let uid = 'user_' + Date.now().toString(36);

      // Attempt Firebase auth registration if password provided
      if (data.password && data.password.length >= 6 && data.email.includes('@')) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
          uid = cred.user.uid;
        } catch (authErr: any) {
          console.warn('Firebase user creation notice:', authErr?.message);
        }
      }

      const newUser: UserProfile = {
        id: uid,
        email: data.email,
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        role: data.role,
        jobTitle: data.jobTitle,
        department: data.department,
        phoneNumber: data.phoneNumber,
        leaveBalance: {
          annual: data.role === 'cd' ? 25 : data.role === 'dcd' ? 24 : 18,
          sick: 12,
          casual: 6,
          emergency: 5,
          unpaidTaken: 0,
        },
        createdAt: new Date().toISOString(),
      };

      // Save locally and in Firestore
      setAllUsers(prev => [...prev, newUser]);
      await setDoc(doc(db, 'users', newUser.id), newUser).catch(() => {});

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth).catch(() => {});
    } finally {
      localStorage.removeItem('lms_current_user_id');
      // Set to demo employee or null
      setCurrentUser(null);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    try {
      await setDoc(doc(db, 'settings', 'global_config'), updated).catch(() => {});
    } catch {}
  };

  // --- LEAVE APPLICATION ACTIONS ---

  const createLeaveRequest = async (data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    contactDuringLeave?: string;
    handoverPerson?: string;
    handoverNotes?: string;
    workflowMode?: WorkflowMode;
    attachments?: { name: string; type: string; size: number; dataUrl: string }[];
  }): Promise<{ success: boolean; request?: LeaveRequest; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Must be logged in to apply for leave' };

    // Determine workflow mode: requested mode, or fall back to system default mode
    const mode = data.workflowMode || appSettings.defaultWorkflowMode;
    const reqId = 'lr_' + Date.now().toString(36);
    const tracking = `LR-${new Date().getFullYear()}-${String(leaveRequests.length + 1).padStart(4, '0')}`;

    // Process attachments to simulate Google Drive upload
    const processedAttachments = (data.attachments || []).map(att => ({
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      name: att.name,
      type: att.type,
      size: att.size,
      dataUrl: att.dataUrl,
      googleDriveFileId: 'gdrive_' + Math.random().toString(36).substring(2, 9),
      googleDriveWebViewLink: att.dataUrl,
      isScannedForm: false,
    }));

    const newRequest: LeaveRequest = {
      id: reqId,
      trackingNumber: tracking,
      employeeId: currentUser.id,
      employeeName: currentUser.displayName,
      employeeEmail: currentUser.email,
      employeeDepartment: currentUser.department,
      employeeJobTitle: currentUser.jobTitle,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      contactDuringLeave: data.contactDuringLeave || currentUser.phoneNumber,
      handoverPerson: data.handoverPerson,
      handoverNotes: data.handoverNotes,
      workflowMode: mode,
      status: 'pending_coordinator',
      attachments: processedAttachments,
      employeeSignature: {
        signedAt: new Date().toISOString(),
        signeeName: currentUser.displayName,
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: currentUser.role,
          action: 'submit',
          notes: `${mode === 'paperback' ? 'Paperback' : 'Digital'} request initiated. Waiting for Coordinator verification.`,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => [newRequest, ...prev]);
    await setDoc(doc(db, 'leaveRequests', newRequest.id), newRequest).catch(() => {});

    return { success: true, request: newRequest };
  };

  const coordinatorVerify = async (requestId: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    const updated: LeaveRequest = {
      ...req,
      status: 'pending_dcd',
      coordinatorVerification: {
        verifiedAt: new Date().toISOString(),
        coordinatorId: currentUser.id,
        coordinatorName: currentUser.displayName,
        notes: notes || 'Verified records and balance. Forwarded to Deputy Country Director (DCD).',
        paperReceived: req.workflowMode === 'paperback',
      },
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: 'coordinator',
          action: 'verify',
          notes: notes || `Coordinator verified ${req.workflowMode === 'paperback' ? 'and received printed physical slip' : 'digital record'}. Forwarded to DCD.`,
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  const dcdApprove = async (requestId: string, comments?: string, signature?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    const updated: LeaveRequest = {
      ...req,
      status: 'pending_cd',
      dcdApproval: {
        approvedAt: new Date().toISOString(),
        dcdId: currentUser.id,
        dcdName: currentUser.displayName,
        comments: comments || 'Approved and recommended. Forwarded to Country Director (CD).',
        signatureUrl: signature || 'e-signed-dcd',
        isPaperSigned: req.workflowMode === 'paperback',
      },
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: 'dcd',
          action: 'dcd_approve',
          notes: comments || (req.workflowMode === 'paperback' ? 'DCD signed physical leave form slip.' : 'DCD digitally approved and signed.'),
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  // Helper to execute automated balance deduction + Calendar event + Sheet log
  const finalizeLeaveApproval = async (req: LeaveRequest, comments?: string, signature?: string) => {
    // 1. Deduct leave balance
    if (appSettings.autoDeductBalance) {
      setAllUsers(prevUsers => prevUsers.map(u => {
        if (u.id === req.employeeId) {
          const curBal = { ...u.leaveBalance };
          if (req.leaveType === 'Annual Leave') {
            curBal.annual = Math.max(0, curBal.annual - req.totalDays);
          } else if (req.leaveType === 'Sick Leave') {
            curBal.sick = Math.max(0, curBal.sick - req.totalDays);
          } else if (req.leaveType === 'Casual Leave') {
            curBal.casual = Math.max(0, curBal.casual - req.totalDays);
          } else if (req.leaveType === 'Emergency Leave') {
            curBal.emergency = Math.max(0, curBal.emergency - req.totalDays);
          } else {
            curBal.unpaidTaken = (curBal.unpaidTaken || 0) + req.totalDays;
          }
          // Update Firestore user document
          setDoc(doc(db, 'users', u.id), { ...u, leaveBalance: curBal }).catch(() => {});
          return { ...u, leaveBalance: curBal };
        }
        return u;
      }));
    }

    // 2. Google Calendar Entry
    let calendarEventId = 'cal_' + Date.now().toString(36);
    let calendarEventLink = '';
    if (appSettings.autoSyncCalendar) {
      const calRes = await GoogleWorkspaceService.createCalendarEvent({
        summary: `Leave: ${req.employeeName} (${req.leaveType})`,
        description: `Approved Leave Application: ${req.trackingNumber}\nEmployee: ${req.employeeName} (${req.employeeDepartment})\nType: ${req.leaveType}\nReason: ${req.reason}\nDays: ${req.totalDays}\nMode: ${req.workflowMode.toUpperCase()}`,
        startDate: req.startDate,
        endDate: req.endDate,
        attendees: [req.employeeEmail]
      }, appSettings.googleCalendarId || 'primary');

      if (calRes.success && calRes.eventId) {
        calendarEventId = calRes.eventId;
        calendarEventLink = calRes.htmlLink || '';
      }
    }

    // 3. Google Sheet Log
    if (appSettings.autoSyncSheets && appSettings.linkedGoogleSheetId) {
      await GoogleWorkspaceService.appendLeaveLogToSheet(appSettings.linkedGoogleSheetId, [
        req.trackingNumber,
        req.employeeName,
        req.employeeEmail,
        req.employeeDepartment,
        req.leaveType,
        req.startDate,
        req.endDate,
        req.totalDays,
        req.workflowMode,
        'APPROVED',
        new Date().toISOString().split('T')[0],
        req.coordinatorVerification?.coordinatorName || 'Coordinator',
        req.dcdApproval?.dcdName || 'DCD',
        currentUser?.displayName || 'CD',
        calendarEventId
      ]);
    }

    return { calendarEventId, calendarEventLink };
  };

  const cdApprove = async (requestId: string, comments?: string, signature?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    // In Paperback mode, CD's in-person physical signature moves request to 'pending_upload_scanned' so coordinator can scan/upload it
    const isPaperback = req.workflowMode === 'paperback';
    const nextStatus = isPaperback ? 'pending_upload_scanned' : 'approved';

    let calData = { calendarEventId: undefined as string | undefined, calendarEventLink: undefined as string | undefined };
    if (!isPaperback) {
      calData = await finalizeLeaveApproval(req, comments, signature);
    }

    const updated: LeaveRequest = {
      ...req,
      status: nextStatus,
      cdApproval: {
        approvedAt: new Date().toISOString(),
        cdId: currentUser.id,
        cdName: currentUser.displayName,
        comments: comments || 'Final Country Director approval granted.',
        signatureUrl: signature || 'e-signed-cd',
        isPaperSigned: isPaperback,
      },
      googleCalendarEventId: calData.calendarEventId || req.googleCalendarEventId,
      googleCalendarEventLink: calData.calendarEventLink || req.googleCalendarEventLink,
      googleSheetRowLogged: !isPaperback ? true : req.googleSheetRowLogged,
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: 'cd',
          action: 'cd_approve',
          notes: comments || (isPaperback 
            ? 'Country Director signed physical leave paper. Forwarded back to Coordinator to upload scanned signed slip.' 
            : 'Country Director final digital approval granted. Balance deducted & Google Calendar updated.'),
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  const coordinatorUploadScannedPaper = async (requestId: string, scannedDataUrl: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    // Upload scanned slip to Google Drive
    const driveUpload = await GoogleWorkspaceService.uploadFileToDrive(
      scannedDataUrl,
      `Signed_Paper_${req.trackingNumber}_${req.employeeName.replace(/\s+/g, '_')}.png`,
      'image/png',
      appSettings.linkedGoogleDriveFolderId
    );

    const scannedAttachment = {
      id: 'att_scanned_' + Date.now().toString(36),
      name: `Physical_Signed_Slip_${req.trackingNumber}.png`,
      type: 'image/png',
      size: 1024 * 250,
      dataUrl: scannedDataUrl,
      googleDriveFileId: driveUpload.fileId || 'gdrive_scanned_slip',
      googleDriveWebViewLink: driveUpload.webViewLink || scannedDataUrl,
      isScannedForm: true,
    };

    // Finalize balance deduction and calendar sync upon scanned upload verification
    const calData = await finalizeLeaveApproval(req);

    const updated: LeaveRequest = {
      ...req,
      status: 'approved',
      attachments: [...req.attachments, scannedAttachment],
      googleCalendarEventId: calData.calendarEventId,
      googleCalendarEventLink: calData.calendarEventLink,
      googleSheetRowLogged: true,
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: 'coordinator',
          action: 'upload_scanned_paper',
          notes: notes || 'Coordinator verified physical signatures from DCD & CD, uploaded scanned signed document to Google Drive, and completed approval.',
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  const rejectRequest = async (requestId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    const updated: LeaveRequest = {
      ...req,
      status: 'rejected',
      rejectionInfo: {
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser.id,
        rejectedByName: currentUser.displayName,
        rejectedRole: currentUser.role,
        reason: reason || 'Application did not meet operational criteria.',
      },
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: currentUser.role,
          action: 'reject',
          notes: `Rejected by ${currentUser.displayName} (${currentUser.role.toUpperCase()}): ${reason}`,
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  const cancelRequest = async (requestId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Unauthorized' };
    const req = leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Request not found' };

    const updated: LeaveRequest = {
      ...req,
      status: 'cancelled',
      history: [
        ...req.history,
        {
          timestamp: new Date().toISOString(),
          actorId: currentUser.id,
          actorName: currentUser.displayName,
          actorRole: currentUser.role,
          action: 'cancel',
          notes: 'Request withdrawn by employee.',
        }
      ],
      updatedAt: new Date().toISOString(),
    };

    setLeaveRequests(prev => prev.map(r => r.id === requestId ? updated : r));
    await updateDoc(doc(db, 'leaveRequests', requestId), updated as any).catch(() => {});
    return { success: true };
  };

  const updateUserBalance = async (userId: string, newBalances: UserProfile['leaveBalance']) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, leaveBalance: newBalances } : u));
    await updateDoc(doc(db, 'users', userId), { leaveBalance: newBalances }).catch(() => {});
  };

  const deleteUser = async (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
    await updateDoc(doc(db, 'users', userId), updates).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        leaveRequests,
        appSettings,
        isLoading,
        error,
        loginWithCredentials,
        registerUser,
        switchDemoUser,
        logout,
        updateSettings,
        createLeaveRequest,
        coordinatorVerify,
        dcdApprove,
        cdApprove,
        coordinatorUploadScannedPaper,
        rejectRequest,
        cancelRequest,
        updateUserBalance,
        deleteUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
