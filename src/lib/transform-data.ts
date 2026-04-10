import { chartColors } from './nivo-theme';

// Transform Gmail data for various chart types
export function transformGmailForCharts(data: any) {
  if (!data) return null;

  const lineData = [{
    id: 'emails',
    data: (data.messagesByDay || []).map((d: any) => ({
      x: d.date.slice(5), // MM-DD
      y: d.count,
    })),
  }];

  const pieData = (data.labels || []).slice(0, 8).map((l: any, i: number) => ({
    id: l.name,
    label: l.name,
    value: l.count,
    color: chartColors[i % chartColors.length],
  }));

  const barData = (data.topSenders || []).slice(0, 8).map((s: any) => ({
    sender: s.name.slice(0, 15),
    count: s.count,
  }));

  const domainPie = (data.topDomains || []).slice(0, 8).map((d: any, i: number) => ({
    id: d.domain,
    label: d.domain,
    value: d.count,
    color: chartColors[i % chartColors.length],
  }));

  const sentVsReceived = [
    { id: 'Sent', label: 'Sent', value: data.sentVsReceived?.sent || 0 },
    { id: 'Received', label: 'Received', value: data.sentVsReceived?.received || 0 },
  ];

  const radarData = (data.labels || []).slice(0, 6).map((l: any) => ({
    label: l.name,
    count: l.count,
  }));

  const calendarData = (data.messagesByDay || []).map((d: any) => ({
    day: d.date,
    value: d.count,
  }));

  const waffleData = (data.labels || []).slice(0, 5).map((l: any, i: number) => ({
    id: l.name,
    label: l.name,
    value: l.count,
    color: chartColors[i % chartColors.length],
  }));

  const attachmentTreemap = {
    name: 'attachments',
    children: (data.attachmentStats?.byType || []).map((t: any) => ({
      name: t.type,
      value: t.count || 1,
    })),
  };

  const funnelData = [
    { id: 'Total Messages', value: data.totalMessages || 0, label: 'Total Messages' },
    { id: 'Threads', value: data.totalThreads || 0, label: 'Threads' },
    { id: 'Unread', value: data.unreadMessages || 0, label: 'Unread' },
    { id: 'With Attachments', value: data.attachmentStats?.total || 0, label: 'Attachments' },
  ].filter(d => d.value > 0);

  // Graph data for Sigma.js
  const graphNodes = [
    { id: 'inbox', label: 'Inbox', type: 'mailbox', size: 15, color: '#6366f1' },
    ...(data.topSenders || []).slice(0, 10).map((s: any, i: number) => ({
      id: `sender-${i}`,
      label: s.name.slice(0, 20),
      type: 'sender',
      size: 5 + s.count * 2,
      color: '#8b5cf6',
    })),
    ...(data.topDomains || []).slice(0, 6).map((d: any, i: number) => ({
      id: `domain-${i}`,
      label: d.domain,
      type: 'domain',
      size: 5 + d.count * 2,
      color: '#a78bfa',
    })),
    ...(data.labels || []).slice(0, 6).map((l: any, i: number) => ({
      id: `label-${i}`,
      label: l.name,
      type: 'label',
      size: 5 + Math.min(l.count / 10, 10),
      color: '#c084fc',
    })),
  ];

  const graphEdges = [
    ...(data.topSenders || []).slice(0, 10).map((_: any, i: number) => ({
      source: `sender-${i}`,
      target: 'inbox',
      weight: 1,
    })),
    ...(data.topDomains || []).slice(0, 6).map((_: any, i: number) => ({
      source: `domain-${i}`,
      target: 'inbox',
      weight: 1,
    })),
    ...(data.labels || []).slice(0, 6).map((_: any, i: number) => ({
      source: 'inbox',
      target: `label-${i}`,
      weight: 1,
    })),
  ];

  return {
    lineData,
    pieData,
    barData,
    domainPie,
    sentVsReceived,
    radarData,
    calendarData,
    waffleData,
    attachmentTreemap,
    funnelData,
    graphNodes,
    graphEdges,
  };
}

// Transform Calendar data for charts
export function transformCalendarForCharts(data: any) {
  if (!data) return null;

  const lineData = [{
    id: 'events',
    data: (data.eventsByDay || []).map((d: any) => ({
      x: d.date.slice(5),
      y: d.count,
    })),
  }];

  const pieData = (data.eventsByCalendar || []).map((c: any, i: number) => ({
    id: c.calendar,
    label: c.calendar,
    value: c.count,
    color: chartColors[i % chartColors.length],
  }));

  const barData = (data.busyHours || []).map((h: any) => ({
    hour: `${h.hour}:00`,
    count: h.count,
  }));

  const durationPie = (data.meetingDuration || []).map((d: any, i: number) => ({
    id: d.range,
    label: d.range,
    value: d.count,
    color: chartColors[i % chartColors.length],
  }));

  const recurringPie = [
    { id: 'Recurring', label: 'Recurring', value: data.recurringVsOneTime?.recurring || 0 },
    { id: 'One-time', label: 'One-time', value: data.recurringVsOneTime?.oneTime || 0 },
  ];

  const attendeeBar = (data.attendeesDistribution || []).map((a: any) => ({
    range: a.range,
    count: a.count,
  }));

  const calendarHeatmap = (data.eventsByDay || []).map((d: any) => ({
    day: d.date,
    value: d.count,
  }));

  const radarData = (data.busyHours || []).filter((_: any, i: number) => i % 3 === 0).map((h: any) => ({
    label: `${h.hour}:00`,
    count: h.count,
  }));

  const organizerBar = (data.topOrganizers || []).slice(0, 8).map((o: any) => ({
    organizer: o.name.slice(0, 15),
    count: o.count,
  }));

  const funnelData = [
    { id: 'Total Events', value: data.totalEvents || 0, label: 'Total Events' },
    { id: 'Upcoming', value: data.upcomingEvents || 0, label: 'Upcoming' },
    { id: 'Recurring', value: data.recurringVsOneTime?.recurring || 0, label: 'Recurring' },
  ].filter(d => d.value > 0);

  // Graph data
  const graphNodes = [
    { id: 'calendar', label: 'Calendar', type: 'calendar', size: 15, color: '#6366f1' },
    ...(data.eventsByCalendar || []).slice(0, 8).map((c: any, i: number) => ({
      id: `cal-${i}`,
      label: c.calendar.slice(0, 20),
      type: 'sub-calendar',
      size: 5 + c.count,
      color: '#8b5cf6',
    })),
    ...(data.topOrganizers || []).slice(0, 8).map((o: any, i: number) => ({
      id: `org-${i}`,
      label: o.name.slice(0, 20),
      type: 'organizer',
      size: 5 + o.count * 2,
      color: '#a78bfa',
    })),
  ];

  const graphEdges = [
    ...(data.eventsByCalendar || []).slice(0, 8).map((_: any, i: number) => ({
      source: 'calendar',
      target: `cal-${i}`,
      weight: 1,
    })),
    ...(data.topOrganizers || []).slice(0, 8).map((_: any, i: number) => ({
      source: `org-${i}`,
      target: 'calendar',
      weight: 1,
    })),
  ];

  return {
    lineData,
    pieData,
    barData,
    durationPie,
    recurringPie,
    attendeeBar,
    calendarHeatmap,
    radarData,
    organizerBar,
    funnelData,
    graphNodes,
    graphEdges,
  };
}

// Transform Drive data for charts
export function transformDriveForCharts(data: any) {
  if (!data) return null;

  const pieData = (data.filesByType || []).map((f: any, i: number) => ({
    id: f.type,
    label: f.type,
    value: f.count,
    color: chartColors[i % chartColors.length],
  }));

  const lineData = [{
    id: 'activity',
    data: (data.recentActivity || []).map((d: any) => ({
      x: d.date.slice(5),
      y: d.count,
    })),
  }];

  const barData = (data.topCollaborators || []).slice(0, 8).map((c: any) => ({
    collaborator: c.name.slice(0, 15),
    count: c.count,
  }));

  const storagePie = [
    { id: 'Used', label: 'Used', value: data.storageUsed || 0 },
    { id: 'Free', label: 'Free', value: Math.max(0, (data.storageLimit || 0) - (data.storageUsed || 0)) },
  ];

  const treemapData = {
    name: 'files',
    children: (data.filesByType || []).map((f: any) => ({
      name: f.type,
      value: f.count,
    })),
  };

  const sunburstData = {
    name: 'Drive',
    children: (data.filesByType || []).map((f: any) => ({
      name: f.type,
      value: f.count,
      children: f.size > 0 ? [{ name: `${f.type} size`, value: f.size / 1024 / 1024 }] : undefined,
    })),
  };

  const funnelData = [
    { id: 'Total Files', value: data.totalFiles || 0, label: 'Total Files' },
    { id: 'Shared', value: data.sharedFiles || 0, label: 'Shared' },
  ].filter(d => d.value > 0);

  // Graph data
  const graphNodes = [
    { id: 'drive', label: 'Google Drive', type: 'drive', size: 15, color: '#6366f1' },
    ...(data.filesByType || []).map((f: any, i: number) => ({
      id: `type-${i}`,
      label: f.type,
      type: 'file-type',
      size: 5 + f.count,
      color: '#8b5cf6',
    })),
    ...(data.topCollaborators || []).slice(0, 6).map((c: any, i: number) => ({
      id: `collab-${i}`,
      label: c.name.slice(0, 20),
      type: 'collaborator',
      size: 5 + c.count * 2,
      color: '#a78bfa',
    })),
  ];

  const graphEdges = [
    ...(data.filesByType || []).map((_: any, i: number) => ({
      source: 'drive',
      target: `type-${i}`,
      weight: 1,
    })),
    ...(data.topCollaborators || []).slice(0, 6).map((_: any, i: number) => ({
      source: `collab-${i}`,
      target: 'drive',
      weight: 1,
    })),
  ];

  return {
    pieData,
    lineData,
    barData,
    storagePie,
    treemapData,
    sunburstData,
    funnelData,
    graphNodes,
    graphEdges,
  };
}

// Transform Contacts data
export function transformContactsForCharts(data: any) {
  if (!data) return null;

  const pieData = (data.contactsByOrganization || []).slice(0, 8).map((o: any, i: number) => ({
    id: o.org,
    label: o.org,
    value: o.count,
    color: chartColors[i % chartColors.length],
  }));

  const barData = (data.contactsByGroup || []).slice(0, 8).map((g: any) => ({
    group: g.group.slice(0, 15),
    count: g.count,
  }));

  const channelPie = [
    { id: 'With Email', label: 'With Email', value: data.contactsWithEmail || 0 },
    { id: 'With Phone', label: 'With Phone', value: data.contactsWithPhone || 0 },
    { id: 'Other', label: 'Other', value: Math.max(0, (data.totalContacts || 0) - (data.contactsWithEmail || 0)) },
  ];

  const graphNodes = [
    { id: 'contacts', label: 'Contacts', type: 'hub', size: 15, color: '#6366f1' },
    ...(data.contactsByOrganization || []).slice(0, 8).map((o: any, i: number) => ({
      id: `org-${i}`,
      label: o.org.slice(0, 20),
      type: 'organization',
      size: 5 + o.count * 2,
      color: '#8b5cf6',
    })),
  ];

  const graphEdges = (data.contactsByOrganization || []).slice(0, 8).map((_: any, i: number) => ({
    source: 'contacts',
    target: `org-${i}`,
    weight: 1,
  }));

  return { pieData, barData, channelPie, graphNodes, graphEdges };
}

// Transform Tasks data
export function transformTasksForCharts(data: any) {
  if (!data) return null;

  const statusPie = [
    { id: 'Completed', label: 'Completed', value: data.completedTasks || 0 },
    { id: 'Pending', label: 'Pending', value: data.pendingTasks || 0 },
    { id: 'Overdue', label: 'Overdue', value: data.overdueTasks || 0 },
  ].filter(d => d.value > 0);

  const barData = (data.tasksByList || []).map((l: any) => ({
    list: l.list.slice(0, 15),
    completed: l.completed,
    pending: l.total - l.completed,
  }));

  const lineData = [{
    id: 'tasks',
    data: (data.tasksByDueDate || []).map((d: any) => ({
      x: d.date.slice(5),
      y: d.count,
    })),
  }];

  const radialBarData = (data.tasksByList || []).map((l: any) => ({
    id: l.list,
    data: [{ x: 'completion', y: l.total > 0 ? Math.round((l.completed / l.total) * 100) : 0 }],
  }));

  const graphNodes = [
    { id: 'tasks', label: 'Tasks', type: 'hub', size: 15, color: '#6366f1' },
    ...(data.tasksByList || []).map((l: any, i: number) => ({
      id: `list-${i}`,
      label: l.list,
      type: 'task-list',
      size: 5 + l.total * 2,
      color: l.completed === l.total ? '#34d399' : '#8b5cf6',
    })),
  ];

  const graphEdges = (data.tasksByList || []).map((_: any, i: number) => ({
    source: 'tasks',
    target: `list-${i}`,
    weight: 1,
  }));

  return { statusPie, barData, lineData, radialBarData, graphNodes, graphEdges };
}

// Generic transform for Sheets/Docs/Slides
export function transformFilesForCharts(data: any, type: string) {
  if (!data) return null;

  const totalKey = type === 'sheets' ? 'totalSpreadsheets' : type === 'docs' ? 'totalDocuments' : 'totalPresentations';
  const sharedKey = type === 'sheets' ? 'sharedSpreadsheets' : type === 'docs' ? 'sharedDocuments' : 'sharedPresentations';

  const sharePie = [
    { id: 'Shared', label: 'Shared', value: data[sharedKey] || 0 },
    { id: 'Private', label: 'Private', value: Math.max(0, (data[totalKey] || 0) - (data[sharedKey] || 0)) },
  ];

  return { sharePie, total: data[totalKey] || 0 };
}

// Transform YouTube data
export function transformYouTubeForCharts(data: any) {
  if (!data) return null;

  const channelBar = (data.topChannels || []).slice(0, 8).map((c: any) => ({
    channel: c.name.slice(0, 15),
    count: c.count,
  }));

  const categoryPie = (data.categoryDistribution || []).map((c: any, i: number) => ({
    id: c.category,
    label: c.category,
    value: c.count,
    color: chartColors[i % chartColors.length],
  }));

  return { channelBar, categoryPie };
}
