import { google } from 'googleapis';
import { DocsStats } from './types';

export async function fetchDocsStats(accessToken: string): Promise<DocsStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      pageSize: 100,
      fields: 'files(id,name,modifiedTime,shared,owners)',
      orderBy: 'modifiedTime desc',
    });

    const files = res.data.files || [];

    return {
      totalDocuments: files.length,
      recentlyModified: files.slice(0, 10).map((f) => ({
        name: f.name || 'Untitled',
        date: f.modifiedTime || '',
      })),
      sharedDocuments: files.filter((f) => f.shared).length,
    };
  } catch (error) {
    console.error('Docs API error:', error);
    return { totalDocuments: 0, recentlyModified: [], sharedDocuments: 0 };
  }
}
