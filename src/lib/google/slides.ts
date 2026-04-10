import { google } from 'googleapis';
import { SlidesStats } from './types';

export async function fetchSlidesStats(accessToken: string): Promise<SlidesStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.presentation'",
      pageSize: 100,
      fields: 'files(id,name,modifiedTime,shared,owners)',
      orderBy: 'modifiedTime desc',
    });

    const files = res.data.files || [];

    return {
      totalPresentations: files.length,
      recentlyModified: files.slice(0, 10).map((f) => ({
        name: f.name || 'Untitled',
        date: f.modifiedTime || '',
      })),
      sharedPresentations: files.filter((f) => f.shared).length,
    };
  } catch (error) {
    console.error('Slides API error:', error);
    return { totalPresentations: 0, recentlyModified: [], sharedPresentations: 0 };
  }
}
