import { google } from 'googleapis';
import { GmailStats, LabelStats, TimeSeriesData, SenderStats, DomainStats } from './types';

export async function fetchGmailStats(accessToken: string): Promise<GmailStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Get profile
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const totalMessages = profile.data.messagesTotal || 0;
    const totalThreads = profile.data.threadsTotal || 0;

    // Get labels
    const labelsRes = await gmail.users.labels.list({ userId: 'me' });
    const labels = labelsRes.data.labels || [];

    const labelStats: LabelStats[] = [];
    const labelColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#7c3aed', '#5b21b6', '#4c1d95'];

    let unreadMessages = 0;

    for (const label of labels.slice(0, 15)) {
      if (label.id && label.name) {
        try {
          const labelDetail = await gmail.users.labels.get({ userId: 'me', id: label.id });
          const count = labelDetail.data.messagesTotal || 0;
          const unread = labelDetail.data.messagesUnread || 0;
          if (label.id === 'INBOX') unreadMessages = unread;
          if (count > 0) {
            labelStats.push({
              name: label.name,
              count,
              color: labelColors[labelStats.length % labelColors.length],
            });
          }
        } catch {
          // Skip inaccessible labels
        }
      }
    }

    // Get recent messages for time series and sender analysis
    const messagesRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 100,
      q: 'newer_than:30d',
    });

    const messages = messagesRes.data.messages || [];
    const messagesByDay: Record<string, number> = {};
    const senderCounts: Record<string, { name: string; email: string; count: number }> = {};
    const domainCounts: Record<string, number> = {};
    let sentCount = 0;
    let receivedCount = 0;
    let attachmentCount = 0;
    const attachmentTypes: Record<string, number> = {};

    for (const msg of messages.slice(0, 50)) {
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Date', 'Subject'],
        });

        const headers = detail.data.payload?.headers || [];
        const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
        const dateHeader = headers.find((h) => h.name === 'Date')?.value || '';
        const labelIds = detail.data.labelIds || [];

        // Parse date
        if (dateHeader) {
          const date = new Date(dateHeader);
          const dayKey = date.toISOString().split('T')[0];
          messagesByDay[dayKey] = (messagesByDay[dayKey] || 0) + 1;
        }

        // Parse sender
        const emailMatch = fromHeader.match(/<(.+?)>/);
        const email = emailMatch ? emailMatch[1] : fromHeader;
        const nameMatch = fromHeader.match(/^(.+?)\s*</);
        const name = nameMatch ? nameMatch[1].replace(/"/g, '') : email;

        if (email) {
          if (!senderCounts[email]) {
            senderCounts[email] = { name, email, count: 0 };
          }
          senderCounts[email].count++;

          const domain = email.split('@')[1];
          if (domain) {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          }
        }

        // Sent vs received
        if (labelIds.includes('SENT')) {
          sentCount++;
        } else {
          receivedCount++;
        }

        // Check for attachments
        const parts = detail.data.payload?.parts || [];
        for (const part of parts) {
          if (part.filename && part.filename.length > 0) {
            attachmentCount++;
            const ext = part.filename.split('.').pop()?.toLowerCase() || 'unknown';
            attachmentTypes[ext] = (attachmentTypes[ext] || 0) + 1;
          }
        }
      } catch {
        // Skip messages that can't be fetched
      }
    }

    // Build time series
    const messagesByDayArr: TimeSeriesData[] = Object.entries(messagesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top senders
    const topSenders: SenderStats[] = Object.values(senderCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top domains
    const topDomains: DomainStats[] = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalMessages,
      unreadMessages,
      totalThreads,
      labels: labelStats.sort((a, b) => b.count - a.count).slice(0, 10),
      messagesByDay: messagesByDayArr,
      topSenders,
      topDomains,
      attachmentStats: {
        total: attachmentCount,
        byType: Object.entries(attachmentTypes).map(([type, count]) => ({ type, count })),
        totalSize: 0,
      },
      responseTimeAvg: 0,
      sentVsReceived: { sent: sentCount, received: receivedCount },
    };
  } catch (error) {
    console.error('Gmail API error:', error);
    return getDefaultGmailStats();
  }
}

function getDefaultGmailStats(): GmailStats {
  return {
    totalMessages: 0,
    unreadMessages: 0,
    totalThreads: 0,
    labels: [],
    messagesByDay: [],
    topSenders: [],
    topDomains: [],
    attachmentStats: { total: 0, byType: [], totalSize: 0 },
    responseTimeAvg: 0,
    sentVsReceived: { sent: 0, received: 0 },
  };
}
