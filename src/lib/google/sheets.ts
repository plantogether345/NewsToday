import { google } from 'googleapis';
import { SheetsStats } from './types';

export async function fetchSheetsStats(accessToken: string): Promise<SheetsStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      pageSize: 100,
      fields: 'files(id,name,modifiedTime,shared,owners)',
      orderBy: 'modifiedTime desc',
    });

    const files = res.data.files || [];

    return {
      totalSpreadsheets: files.length,
      recentlyModified: files.slice(0, 10).map((f) => ({
        name: f.name || 'Untitled',
        date: f.modifiedTime || '',
      })),
      sharedSpreadsheets: files.filter((f) => f.shared).length,
    };
  } catch (error) {
    console.error('Sheets API error:', error);
    return { totalSpreadsheets: 0, recentlyModified: [], sharedSpreadsheets: 0 };
  }
}
