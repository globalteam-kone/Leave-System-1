// Google Workspace API Client for Calendar, Drive, and Sheets

interface CalendarEventInput {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  attendees?: string[];
}

export class GoogleWorkspaceService {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  // Initialize or set token (e.g. from Google OAuth or user session)
  static setAccessToken(token: string, expiresInSeconds: number = 3600) {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + (expiresInSeconds * 1000);
    try {
      localStorage.setItem('gw_access_token', token);
      localStorage.setItem('gw_token_expiry', this.tokenExpiry.toString());
    } catch {
      // ignore
    }
  }

  static getAccessToken(): string | null {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    try {
      const stored = localStorage.getItem('gw_access_token');
      const exp = Number(localStorage.getItem('gw_token_expiry') || '0');
      if (stored && Date.now() < exp) {
        this.accessToken = stored;
        this.tokenExpiry = exp;
        return stored;
      }
    } catch {
      // ignore
    }
    return null;
  }

  static isConnected(): boolean {
    return !!this.getAccessToken();
  }

  static disconnect() {
    this.accessToken = null;
    this.tokenExpiry = 0;
    try {
      localStorage.removeItem('gw_access_token');
      localStorage.removeItem('gw_token_expiry');
    } catch {}
  }

  // --- GOOGLE CALENDAR ---
  static async createCalendarEvent(event: CalendarEventInput, calendarId: string = 'primary'): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      // If not linked with live Google OAuth token, generate mock simulation link for seamless prototype verification
      console.log('Google Workspace token not connected. Generating mock Calendar Entry record.');
      const mockId = 'cal_' + Math.random().toString(36).substring(2, 10);
      return {
        success: true,
        eventId: mockId,
        htmlLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.summary)}&dates=${event.startDate.replace(/-/g, '')}/${event.endDate.replace(/-/g, '')}&details=${encodeURIComponent(event.description)}`
      };
    }

    try {
      // Add 1 day to end date for all-day Google Calendar standard format
      const endObj = new Date(event.endDate);
      endObj.setDate(endObj.getDate() + 1);
      const formattedEnd = endObj.toISOString().split('T')[0];

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { date: event.startDate },
          end: { date: formattedEnd },
          transparency: 'opaque', // Shows as Busy
          attendees: event.attendees ? event.attendees.map(email => ({ email })) : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to create calendar event (${res.status})`);
      }

      const data = await res.json();
      return {
        success: true,
        eventId: data.id,
        htmlLink: data.htmlLink
      };
    } catch (e: any) {
      console.error('Error creating Google Calendar event:', e);
      return { success: false, error: e.message };
    }
  }

  // --- GOOGLE DRIVE ---
  static async uploadFileToDrive(fileDataUrl: string, fileName: string, mimeType: string, folderId?: string): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      console.log('Google Workspace token not connected. Storing simulated Drive file representation.');
      const mockFileId = 'gdrive_' + Math.random().toString(36).substring(2, 10);
      return {
        success: true,
        fileId: mockFileId,
        webViewLink: fileDataUrl.startsWith('data:') ? fileDataUrl : `https://drive.google.com/file/d/${mockFileId}/view`
      };
    }

    try {
      // Convert base64 DataURL to Blob
      const base64Data = fileDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const metadata: any = {
        name: fileName,
        mimeType: mimeType,
      };
      if (folderId) {
        metadata.parents = [folderId];
      }

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to upload to Google Drive (${res.status})`);
      }

      const data = await res.json();
      return {
        success: true,
        fileId: data.id,
        webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
      };
    } catch (e: any) {
      console.error('Error uploading file to Drive:', e);
      return { success: false, error: e.message };
    }
  }

  // --- GOOGLE SHEETS ---
  static async appendLeaveLogToSheet(spreadsheetId: string, rowValues: (string | number)[]): Promise<{ success: boolean; error?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      console.log('Google Workspace token not connected. Simulated Sheet log append succeeded.');
      return { success: true };
    }

    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowValues]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Failed to append to Google Sheet (${res.status})`);
      }

      return { success: true };
    } catch (e: any) {
      console.error('Error appending row to Google Sheets:', e);
      return { success: false, error: e.message };
    }
  }

  // Create a new master spreadsheet for Leave Management Logs
  static async createMasterSpreadsheet(title: string = 'Leave_Management_Master_Log'): Promise<{ success: boolean; spreadsheetId?: string; spreadsheetUrl?: string; error?: string }> {
    const token = this.getAccessToken();
    if (!token) {
      const mockId = 'sheet_' + Math.random().toString(36).substring(2, 10);
      return {
        success: true,
        spreadsheetId: mockId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${mockId}/edit`
      };
    }

    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            {
              properties: { title: 'Leave_Requests_Log' },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    {
                      values: [
                        { userEnteredValue: { stringValue: 'Tracking ID' } },
                        { userEnteredValue: { stringValue: 'Employee Name' } },
                        { userEnteredValue: { stringValue: 'Email' } },
                        { userEnteredValue: { stringValue: 'Department' } },
                        { userEnteredValue: { stringValue: 'Leave Type' } },
                        { userEnteredValue: { stringValue: 'Start Date' } },
                        { userEnteredValue: { stringValue: 'End Date' } },
                        { userEnteredValue: { stringValue: 'Days' } },
                        { userEnteredValue: { stringValue: 'Workflow Mode' } },
                        { userEnteredValue: { stringValue: 'Status' } },
                        { userEnteredValue: { stringValue: 'Approved Date' } },
                        { userEnteredValue: { stringValue: 'Coordinator' } },
                        { userEnteredValue: { stringValue: 'DCD Signer' } },
                        { userEnteredValue: { stringValue: 'CD Signer' } },
                        { userEnteredValue: { stringValue: 'Calendar Event ID' } }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Failed to create Google Sheet');
      }

      const data = await res.json();
      return {
        success: true,
        spreadsheetId: data.spreadsheetId,
        spreadsheetUrl: data.spreadsheetUrl
      };
    } catch (e: any) {
      console.error('Error creating Google Sheet:', e);
      return { success: false, error: e.message };
    }
  }
}
