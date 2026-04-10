import { google } from 'googleapis';
import { DriveStats } from './types';

export async function fetchDriveStats(accessToken: string): Promise<DriveStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get storage quota
    const about = await drive.about.get({ fields: 'storageQuota,user' });
    const storageUsed = parseInt(about.data.storageQuota?.usage || '0');
    const storageLimit = parseInt(about.data.storageQuota?.limit || '0');

    // Get files
    const filesRes = await drive.files.list({
      pageSize: 200,
      fields: 'files(id,name,mimeType,size,modifiedTime,shared,owners,parents)',
      orderBy: 'modifiedTime desc',
    });

    const files = filesRes.data.files || [];
    const totalFiles = files.length;

    const filesByType: Record<string, { count: number; size: number }> = {};
    const recentActivity: Record<string, number> = {};
    let sharedFiles = 0;
    const collaborators: Record<string, number> = {};
    const folderCounts: Record<string, number> = {};

    for (const file of files) {
      // By type
      const mimeType = file.mimeType || 'unknown';
      const typeName = getMimeTypeName(mimeType);
      if (!filesByType[typeName]) filesByType[typeName] = { count: 0, size: 0 };
      filesByType[typeName].count++;
      filesByType[typeName].size += parseInt(file.size || '0');

      // Recent activity
      if (file.modifiedTime) {
        const day = file.modifiedTime.split('T')[0];
        recentActivity[day] = (recentActivity[day] || 0) + 1;
      }

      // Shared
      if (file.shared) sharedFiles++;

      // Collaborators
      if (file.owners) {
        for (const owner of file.owners) {
          const name = owner.displayName || owner.emailAddress || 'Unknown';
          collaborators[name] = (collaborators[name] || 0) + 1;
        }
      }
    }

    return {
      totalFiles,
      totalSize: storageUsed,
      filesByType: Object.entries(filesByType)
        .map(([type, data]) => ({ type, count: data.count, size: data.size }))
        .sort((a, b) => b.count - a.count),
      recentActivity: Object.entries(recentActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30),
      sharedFiles,
      storageUsed,
      storageLimit,
      topCollaborators: Object.entries(collaborators)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      filesByFolder: Object.entries(folderCounts)
        .map(([folder, count]) => ({ folder, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  } catch (error) {
    console.error('Drive API error:', error);
    return getDefaultDriveStats();
  }
}

function getMimeTypeName(mimeType: string): string {
  const map: Record<string, string> = {
    'application/vnd.google-apps.document': 'Google Docs',
    'application/vnd.google-apps.spreadsheet': 'Google Sheets',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/vnd.google-apps.folder': 'Folders',
    'application/vnd.google-apps.form': 'Google Forms',
    'application/pdf': 'PDF',
    'image/jpeg': 'Images',
    'image/png': 'Images',
    'image/gif': 'Images',
    'video/mp4': 'Videos',
    'application/zip': 'Archives',
    'text/plain': 'Text Files',
    'text/csv': 'CSV',
  };
  return map[mimeType] || 'Other';
}

function getDefaultDriveStats(): DriveStats {
  return {
    totalFiles: 0,
    totalSize: 0,
    filesByType: [],
    recentActivity: [],
    sharedFiles: 0,
    storageUsed: 0,
    storageLimit: 0,
    topCollaborators: [],
    filesByFolder: [],
  };
}
