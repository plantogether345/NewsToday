'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Mail, Calendar, HardDrive, Users, CheckSquare, FileSpreadsheet,
  FileText, Presentation, Youtube, CircleDot, LogOut, ChevronDown,
  LayoutGrid, Loader2, RefreshCw
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import dynamic from 'next/dynamic';
import {
  BarChart, LineChart, PieChart, RadarChart, HeatMapChart,
  TreeMapChart, BumpChart, CalendarChart, ChordChart, CirclePackingChart,
  FunnelChart, NetworkChart, SankeyChart, ScatterPlotChart, StreamChart,
  SunburstChart, SwarmPlotChart, VoronoiChart, WaffleChart, MarimekkoChart,
  RadialBarChart
} from '@/components/dashboard/NivoCharts';

const GraphAnalytics = dynamic(
  () => import('@/components/dashboard/GraphAnalytics').then(mod => ({ default: mod.GraphAnalytics })),
  { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center"><p className="text-white/30 text-xs">Loading graph...</p></div> }
);
import {
  transformGmailForCharts, transformCalendarForCharts,
  transformDriveForCharts, transformContactsForCharts,
  transformTasksForCharts, transformFilesForCharts,
  transformYouTubeForCharts
} from '@/lib/transform-data';
import { GoogleTool } from '@/lib/google/types';

const tools: { id: GoogleTool; name: string; icon: any; description: string }[] = [
  { id: 'overview', name: 'Overview', icon: LayoutGrid, description: 'Workspace overview' },
  { id: 'gmail', name: 'Gmail', icon: Mail, description: 'Email analytics & patterns' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Meeting intelligence' },
  { id: 'drive', name: 'Drive', icon: HardDrive, description: 'Storage & file insights' },
  { id: 'contacts', name: 'Contacts', icon: Users, description: 'Network analysis' },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare, description: 'Productivity tracking' },
  { id: 'sheets', name: 'Sheets', icon: FileSpreadsheet, description: 'Spreadsheet analytics' },
  { id: 'docs', name: 'Docs', icon: FileText, description: 'Document intelligence' },
  { id: 'slides', name: 'Slides', icon: Presentation, description: 'Presentation metrics' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, description: 'Watch analytics' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<GoogleTool>('overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toolData, setToolData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchToolData = useCallback(async (tool: string) => {
    if (tool === 'overview' || toolData[tool] || loading[tool]) return;

    setLoading((prev) => ({ ...prev, [tool]: true }));
    try {
      const res = await fetch(`/api/workspace/${tool}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setToolData((prev) => ({ ...prev, [tool]: data }));
        } else {
          console.error(`API error for ${tool}:`, data.error);
        }
      } else {
        console.error(`HTTP error for ${tool}:`, res.status);
      }
    } catch (error) {
      console.error(`Failed to fetch ${tool} data:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [tool]: false }));
    }
  }, [toolData, loading]);

  useEffect(() => {
    if (selectedTool !== 'overview') {
      fetchToolData(selectedTool);
    } else {
      // Fetch gmail and calendar for overview
      fetchToolData('gmail');
      fetchToolData('calendar');
      fetchToolData('drive');
    }
  }, [selectedTool, fetchToolData]);

  const refreshTool = async (tool: string) => {
    setToolData((prev) => {
      const next = { ...prev };
      delete next[tool];
      return next;
    });
    setLoading((prev) => ({ ...prev, [tool]: true }));
    try {
      const res = await fetch(`/api/workspace/${tool}`);
      if (res.ok) {
        const data = await res.json();
        setToolData((prev) => ({ ...prev, [tool]: data }));
      }
    } catch (error) {
      console.error(`Failed to refresh ${tool} data:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [tool]: false }));
    }
  };

  if (status === 'loading') {
    return (
      <main className="relative min-h-screen flex items-center justify-center z-10">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </main>
    );
  }

  const currentTool = tools.find((t) => t.id === selectedTool)!;

  return (
    <main className="relative min-h-screen z-10">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#050507]/80 border-b border-white/5">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white">
            <CircleDot className="w-5 h-5 text-white/80" />
            <span className="font-medium tracking-wide text-sm">Integrate.co</span>
          </div>

          {/* Tool Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl text-sm font-medium text-white/80 hover:text-white hover:border-white/20 transition-all"
            >
              <currentTool.icon className="w-4 h-4" />
              {currentTool.name}
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 glass-card rounded-xl overflow-hidden z-50 py-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      selectedTool === tool.id
                        ? 'text-white bg-white/[0.06]'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                    }`}
                  >
                    <tool.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div>{tool.name}</div>
                      <div className="text-[10px] text-white/30">{tool.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="avatar"
                className="w-7 h-7 rounded-full border border-white/10"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight">
              {currentTool.name} Analytics
            </h1>
            <p className="text-xs text-white/40 mt-1 font-medium">
              {session?.user?.email} &middot; {currentTool.description}
            </p>
          </div>
          {selectedTool !== 'overview' && (
            <button
              onClick={() => refreshTool(selectedTool)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white/50 hover:text-white border border-white/5 hover:border-white/15 rounded-lg bg-white/[0.02] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading[selectedTool] ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>

        {/* Content based on selected tool */}
        {selectedTool === 'overview' && <OverviewDashboard data={toolData} loading={loading} />}
        {selectedTool === 'gmail' && <GmailDashboard data={toolData.gmail} loading={loading.gmail} />}
        {selectedTool === 'calendar' && <CalendarDashboard data={toolData.calendar} loading={loading.calendar} />}
        {selectedTool === 'drive' && <DriveDashboard data={toolData.drive} loading={loading.drive} />}
        {selectedTool === 'contacts' && <ContactsDashboard data={toolData.contacts} loading={loading.contacts} />}
        {selectedTool === 'tasks' && <TasksDashboard data={toolData.tasks} loading={loading.tasks} />}
        {selectedTool === 'sheets' && <FilesDashboard data={toolData.sheets} loading={loading.sheets} type="sheets" />}
        {selectedTool === 'docs' && <FilesDashboard data={toolData.docs} loading={loading.docs} type="docs" />}
        {selectedTool === 'slides' && <FilesDashboard data={toolData.slides} loading={loading.slides} type="slides" />}
        {selectedTool === 'youtube' && <YouTubeDashboard data={toolData.youtube} loading={loading.youtube} />}
      </div>
    </main>
  );
}

// ==================== LOADING SKELETON ====================
function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        <p className="text-xs text-white/30 font-medium">Fetching analytics data...</p>
      </div>
    </div>
  );
}

// ==================== OVERVIEW DASHBOARD ====================
function OverviewDashboard({ data, loading }: { data: any; loading: any }) {
  const gmail = data.gmail;
  const calendar = data.calendar;
  const drive = data.drive;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Emails"
          value={gmail?.totalMessages || '---'}
          subtitle="All time"
          icon={<Mail className="w-4 h-4" />}
        />
        <KPICard
          title="Unread"
          value={gmail?.unreadMessages || '---'}
          subtitle="In inbox"
          trend={gmail?.unreadMessages > 50 ? 'up' : 'neutral'}
        />
        <KPICard
          title="Calendar Events"
          value={calendar?.totalEvents || '---'}
          subtitle="Last 30 days"
          icon={<Calendar className="w-4 h-4" />}
        />
        <KPICard
          title="Drive Files"
          value={drive?.totalFiles || '---'}
          subtitle="Total files"
          icon={<HardDrive className="w-4 h-4" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gmail && (
          <ChartCard title="Email Volume" subtitle="Messages per day (last 30 days)">
            <LineChart data={transformGmailForCharts(gmail)?.lineData || []} />
          </ChartCard>
        )}
        {calendar && (
          <ChartCard title="Busy Hours" subtitle="Events by hour of day">
            <BarChart
              data={transformCalendarForCharts(calendar)?.barData || []}
              keys={['count']}
              indexBy="hour"
            />
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gmail && (
          <ChartCard title="Email Labels" subtitle="Distribution by label">
            <PieChart data={transformGmailForCharts(gmail)?.pieData || []} />
          </ChartCard>
        )}
        {calendar && (
          <ChartCard title="Meeting Duration" subtitle="Distribution of meeting lengths">
            <PieChart data={transformCalendarForCharts(calendar)?.durationPie || []} />
          </ChartCard>
        )}
        {drive && (
          <ChartCard title="File Types" subtitle="Distribution by type">
            <PieChart data={transformDriveForCharts(drive)?.pieData || []} />
          </ChartCard>
        )}
      </div>

      {(loading.gmail || loading.calendar || loading.drive) && <LoadingSkeleton />}
    </div>
  );
}

// ==================== GMAIL DASHBOARD ====================
function GmailDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformGmailForCharts(data);
  if (!charts) return null;

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard title="Total Messages" value={data.totalMessages} icon={<Mail className="w-4 h-4" />} />
        <KPICard title="Unread" value={data.unreadMessages} trend={data.unreadMessages > 50 ? 'up' : 'neutral'} />
        <KPICard title="Threads" value={data.totalThreads} />
        <KPICard title="Sent" value={data.sentVsReceived?.sent || 0} />
        <KPICard title="Attachments" value={data.attachmentStats?.total || 0} />
      </div>

      {/* Line + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Email Volume Over Time" subtitle="Line chart - Messages per day">
          <LineChart data={charts.lineData} />
        </ChartCard>
        <ChartCard title="Top Senders" subtitle="Bar chart - Most frequent senders">
          <BarChart data={charts.barData} keys={['count']} indexBy="sender" />
        </ChartCard>
      </div>

      {/* Pie + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Labels Distribution" subtitle="Pie chart">
          <PieChart data={charts.pieData} />
        </ChartCard>
        <ChartCard title="Top Domains" subtitle="Pie chart - Sender domains">
          <PieChart data={charts.domainPie} />
        </ChartCard>
        <ChartCard title="Sent vs Received" subtitle="Pie chart">
          <PieChart data={charts.sentVsReceived} />
        </ChartCard>
      </div>

      {/* Calendar Heatmap + Waffle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Email Activity Calendar" subtitle="Calendar heatmap">
          <CalendarChart
            data={charts.calendarData}
            from={thirtyDaysAgo.toISOString().split('T')[0]}
            to={today.toISOString().split('T')[0]}
          />
        </ChartCard>
        <ChartCard title="Labels Overview" subtitle="Waffle chart">
          <WaffleChart data={charts.waffleData} />
        </ChartCard>
      </div>

      {/* TreeMap + Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Attachment Types" subtitle="TreeMap chart">
          <TreeMapChart data={charts.attachmentTreemap} />
        </ChartCard>
        <ChartCard title="Email Funnel" subtitle="Funnel chart">
          <FunnelChart data={charts.funnelData} />
        </ChartCard>
      </div>

      {/* Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Label Activity Radar" subtitle="Radar chart">
          <RadarChart data={charts.radarData} keys={['count']} indexBy="label" />
        </ChartCard>
        <ChartCard title="Radial Bar - Labels" subtitle="Radial bar chart">
          <RadialBarChart
            data={(data.labels || []).slice(0, 5).map((l: any) => ({
              id: l.name,
              data: [{ x: 'messages', y: l.count }],
            }))}
          />
        </ChartCard>
      </div>

      {/* Graph Analytics */}
      <ChartCard title="Gmail Network Graph" subtitle="Interactive graph - Drag nodes individually to explore relationships">
        <GraphAnalytics
          nodes={charts.graphNodes}
          edges={charts.graphEdges}
          title="Email Communication Network"
        />
      </ChartCard>
    </div>
  );
}

// ==================== CALENDAR DASHBOARD ====================
function CalendarDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformCalendarForCharts(data);
  if (!charts) return null;

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Events" value={data.totalEvents} icon={<Calendar className="w-4 h-4" />} />
        <KPICard title="Upcoming" value={data.upcomingEvents} trend="neutral" />
        <KPICard title="Recurring" value={data.recurringVsOneTime?.recurring || 0} />
        <KPICard title="One-Time" value={data.recurringVsOneTime?.oneTime || 0} />
      </div>

      {/* Line + Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Events Over Time" subtitle="Line chart">
          <LineChart data={charts.lineData} />
        </ChartCard>
        <ChartCard title="Busy Hours" subtitle="Bar chart - Events by hour">
          <BarChart data={charts.barData} keys={['count']} indexBy="hour" />
        </ChartCard>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="By Calendar" subtitle="Pie chart">
          <PieChart data={charts.pieData} />
        </ChartCard>
        <ChartCard title="Meeting Duration" subtitle="Pie chart">
          <PieChart data={charts.durationPie} />
        </ChartCard>
        <ChartCard title="Recurring vs One-Time" subtitle="Pie chart">
          <PieChart data={charts.recurringPie} />
        </ChartCard>
      </div>

      {/* Attendees + Organizers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Attendees Distribution" subtitle="Bar chart">
          <BarChart data={charts.attendeeBar} keys={['count']} indexBy="range" />
        </ChartCard>
        <ChartCard title="Top Organizers" subtitle="Bar chart">
          <BarChart data={charts.organizerBar} keys={['count']} indexBy="organizer" />
        </ChartCard>
      </div>

      {/* Calendar Heatmap + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Event Calendar" subtitle="Calendar heatmap">
          <CalendarChart
            data={charts.calendarHeatmap}
            from={thirtyDaysAgo.toISOString().split('T')[0]}
            to={today.toISOString().split('T')[0]}
          />
        </ChartCard>
        <ChartCard title="Peak Hours Radar" subtitle="Radar chart">
          <RadarChart data={charts.radarData} keys={['count']} indexBy="label" />
        </ChartCard>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Events Funnel" subtitle="Funnel chart">
          <FunnelChart data={charts.funnelData} />
        </ChartCard>
        <ChartCard title="Radial Schedule" subtitle="Radial bar chart">
          <RadialBarChart
            data={(data.eventsByCalendar || []).slice(0, 5).map((c: any) => ({
              id: c.calendar,
              data: [{ x: 'events', y: c.count }],
            }))}
          />
        </ChartCard>
      </div>

      {/* Graph Analytics */}
      <ChartCard title="Calendar Network Graph" subtitle="Interactive graph - Drag nodes individually">
        <GraphAnalytics
          nodes={charts.graphNodes}
          edges={charts.graphEdges}
          title="Calendar & Organizer Network"
        />
      </ChartCard>
    </div>
  );
}

// ==================== DRIVE DASHBOARD ====================
function DriveDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformDriveForCharts(data);
  if (!charts) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Files" value={data.totalFiles} icon={<HardDrive className="w-4 h-4" />} />
        <KPICard title="Shared Files" value={data.sharedFiles} />
        <KPICard title="Storage Used" value={formatBytes(data.storageUsed)} />
        <KPICard title="Storage Limit" value={formatBytes(data.storageLimit)} />
      </div>

      {/* Pie + Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="File Types" subtitle="Pie chart">
          <PieChart data={charts.pieData} />
        </ChartCard>
        <ChartCard title="Recent Activity" subtitle="Line chart">
          <LineChart data={charts.lineData} />
        </ChartCard>
      </div>

      {/* Bar + Storage Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Top Collaborators" subtitle="Bar chart">
          <BarChart data={charts.barData} keys={['count']} indexBy="collaborator" />
        </ChartCard>
        <ChartCard title="Storage Usage" subtitle="Pie chart">
          <PieChart data={charts.storagePie} />
        </ChartCard>
      </div>

      {/* TreeMap + Sunburst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="File Type Distribution" subtitle="TreeMap">
          <TreeMapChart data={charts.treemapData} />
        </ChartCard>
        <ChartCard title="Drive Hierarchy" subtitle="Sunburst chart">
          <SunburstChart data={charts.sunburstData} />
        </ChartCard>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Files Funnel" subtitle="Funnel chart">
          <FunnelChart data={charts.funnelData} />
        </ChartCard>
        <ChartCard title="File Types Waffle" subtitle="Waffle chart">
          <WaffleChart data={charts.pieData.slice(0, 5)} />
        </ChartCard>
      </div>

      {/* Graph Analytics */}
      <ChartCard title="Drive Network Graph" subtitle="Interactive graph - Drag nodes individually">
        <GraphAnalytics
          nodes={charts.graphNodes}
          edges={charts.graphEdges}
          title="File Types & Collaborators Network"
        />
      </ChartCard>
    </div>
  );
}

// ==================== CONTACTS DASHBOARD ====================
function ContactsDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformContactsForCharts(data);
  if (!charts) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Contacts" value={data.totalContacts} icon={<Users className="w-4 h-4" />} />
        <KPICard title="With Email" value={data.contactsWithEmail} />
        <KPICard title="With Phone" value={data.contactsWithPhone} />
        <KPICard title="Recently Added" value={data.recentlyAdded} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="By Organization" subtitle="Pie chart">
          <PieChart data={charts.pieData} />
        </ChartCard>
        <ChartCard title="By Group" subtitle="Bar chart">
          <BarChart data={charts.barData} keys={['count']} indexBy="group" />
        </ChartCard>
        <ChartCard title="Contact Channels" subtitle="Pie chart">
          <PieChart data={charts.channelPie} />
        </ChartCard>
      </div>

      <ChartCard title="Contact Network Graph" subtitle="Interactive graph">
        <GraphAnalytics nodes={charts.graphNodes} edges={charts.graphEdges} title="Organization Network" />
      </ChartCard>
    </div>
  );
}

// ==================== TASKS DASHBOARD ====================
function TasksDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformTasksForCharts(data);
  if (!charts) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Tasks" value={data.totalTasks} icon={<CheckSquare className="w-4 h-4" />} />
        <KPICard title="Completed" value={data.completedTasks} trend="up" />
        <KPICard title="Pending" value={data.pendingTasks} />
        <KPICard title="Overdue" value={data.overdueTasks} trend={data.overdueTasks > 0 ? 'down' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Task Status" subtitle="Pie chart">
          <PieChart data={charts.statusPie} />
        </ChartCard>
        <ChartCard title="Tasks by List" subtitle="Bar chart">
          <BarChart data={charts.barData} keys={['completed', 'pending']} indexBy="list" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Tasks Over Time" subtitle="Line chart">
          <LineChart data={charts.lineData} />
        </ChartCard>
        <ChartCard title="Completion Rate" subtitle="Radial bar">
          <RadialBarChart data={charts.radialBarData} />
        </ChartCard>
      </div>

      <ChartCard title="Tasks Network Graph" subtitle="Interactive graph">
        <GraphAnalytics nodes={charts.graphNodes} edges={charts.graphEdges} title="Task Lists Network" />
      </ChartCard>
    </div>
  );
}

// ==================== FILES DASHBOARD (Sheets/Docs/Slides) ====================
function FilesDashboard({ data, loading, type }: { data: any; loading: boolean; type: string }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformFilesForCharts(data, type);
  if (!charts) return null;

  const iconMap: Record<string, any> = {
    sheets: FileSpreadsheet,
    docs: FileText,
    slides: Presentation,
  };
  const Icon = iconMap[type] || FileText;
  const nameMap: Record<string, string> = { sheets: 'Spreadsheets', docs: 'Documents', slides: 'Presentations' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard title={`Total ${nameMap[type]}`} value={charts.total} icon={<Icon className="w-4 h-4" />} />
        <KPICard title="Shared" value={charts.sharePie[0].value} />
        <KPICard title="Private" value={charts.sharePie[1].value} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Sharing Status" subtitle="Pie chart">
          <PieChart data={charts.sharePie} />
        </ChartCard>
        <ChartCard title="Sharing Overview" subtitle="Waffle chart">
          <WaffleChart data={charts.sharePie} />
        </ChartCard>
      </div>

      {data.recentlyModified && data.recentlyModified.length > 0 && (
        <ChartCard title="Recently Modified" subtitle="Latest files">
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {data.recentlyModified.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/70 truncate mr-4">{f.name}</span>
                <span className="text-[10px] text-white/30 whitespace-nowrap">
                  {f.date ? new Date(f.date).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

// ==================== YOUTUBE DASHBOARD ====================
function YouTubeDashboard({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <LoadingSkeleton />;
  if (!data) return <LoadingSkeleton />;

  const charts = transformYouTubeForCharts(data);
  if (!charts) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard title="Subscriptions" value={data.totalSubscriptions} icon={<Youtube className="w-4 h-4" />} />
        <KPICard title="Liked Videos" value={data.totalLikedVideos} />
        <KPICard title="Top Channels" value={data.topChannels?.length || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Top Channels" subtitle="Bar chart">
          <BarChart data={charts.channelBar} keys={['count']} indexBy="channel" />
        </ChartCard>
        <ChartCard title="Categories" subtitle="Pie chart">
          <PieChart data={charts.categoryPie} />
        </ChartCard>
      </div>
    </div>
  );
}
