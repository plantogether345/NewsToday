export interface GmailStats {
  totalMessages: number;
  unreadMessages: number;
  totalThreads: number;
  labels: LabelStats[];
  messagesByDay: TimeSeriesData[];
  topSenders: SenderStats[];
  topDomains: DomainStats[];
  attachmentStats: AttachmentStats;
  responseTimeAvg: number;
  sentVsReceived: { sent: number; received: number };
}

export interface LabelStats {
  name: string;
  count: number;
  color: string;
}

export interface TimeSeriesData {
  date: string;
  count: number;
}

export interface SenderStats {
  email: string;
  name: string;
  count: number;
}

export interface DomainStats {
  domain: string;
  count: number;
}

export interface AttachmentStats {
  total: number;
  byType: { type: string; count: number }[];
  totalSize: number;
}

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  eventsByDay: TimeSeriesData[];
  eventsByCalendar: { calendar: string; count: number }[];
  busyHours: { hour: number; count: number }[];
  meetingDuration: { range: string; count: number }[];
  recurringVsOneTime: { recurring: number; oneTime: number };
  attendeesDistribution: { range: string; count: number }[];
  topOrganizers: { name: string; count: number }[];
}

export interface DriveStats {
  totalFiles: number;
  totalSize: number;
  filesByType: { type: string; count: number; size: number }[];
  recentActivity: { date: string; count: number }[];
  sharedFiles: number;
  storageUsed: number;
  storageLimit: number;
  topCollaborators: { name: string; count: number }[];
  filesByFolder: { folder: string; count: number }[];
}

export interface ContactsStats {
  totalContacts: number;
  contactsByGroup: { group: string; count: number }[];
  contactsByOrganization: { org: string; count: number }[];
  contactsWithEmail: number;
  contactsWithPhone: number;
  recentlyAdded: number;
}

export interface TasksStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasksByList: { list: string; total: number; completed: number }[];
  tasksByDueDate: TimeSeriesData[];
  overdueTasks: number;
}

export interface SheetsStats {
  totalSpreadsheets: number;
  recentlyModified: { name: string; date: string }[];
  sharedSpreadsheets: number;
}

export interface DocsStats {
  totalDocuments: number;
  recentlyModified: { name: string; date: string }[];
  sharedDocuments: number;
}

export interface SlidesStats {
  totalPresentations: number;
  recentlyModified: { name: string; date: string }[];
  sharedPresentations: number;
}

export interface YouTubeStats {
  totalSubscriptions: number;
  totalLikedVideos: number;
  watchHistory: TimeSeriesData[];
  topChannels: { name: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
}

export interface WorkspaceOverview {
  gmail: GmailStats;
  calendar: CalendarStats;
  drive: DriveStats;
  contacts: ContactsStats;
  tasks: TasksStats;
}

export type GoogleTool =
  | 'overview'
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'contacts'
  | 'tasks'
  | 'sheets'
  | 'docs'
  | 'slides'
  | 'youtube';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}
