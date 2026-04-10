import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchGmailStats } from '@/lib/google/gmail';
import { fetchCalendarStats } from '@/lib/google/calendar';
import { fetchDriveStats } from '@/lib/google/drive';
import { fetchContactsStats } from '@/lib/google/contacts';
import { fetchTasksStats } from '@/lib/google/tasks';
import { fetchSheetsStats } from '@/lib/google/sheets';
import { fetchDocsStats } from '@/lib/google/docs';
import { fetchSlidesStats } from '@/lib/google/slides';
import { fetchYouTubeStats } from '@/lib/google/youtube';

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;
  const tool = params.tool;

  try {
    let data;

    switch (tool) {
      case 'gmail':
        data = await fetchGmailStats(accessToken);
        break;
      case 'calendar':
        data = await fetchCalendarStats(accessToken);
        break;
      case 'drive':
        data = await fetchDriveStats(accessToken);
        break;
      case 'contacts':
        data = await fetchContactsStats(accessToken);
        break;
      case 'tasks':
        data = await fetchTasksStats(accessToken);
        break;
      case 'sheets':
        data = await fetchSheetsStats(accessToken);
        break;
      case 'docs':
        data = await fetchDocsStats(accessToken);
        break;
      case 'slides':
        data = await fetchSlidesStats(accessToken);
        break;
      case 'youtube':
        data = await fetchYouTubeStats(accessToken);
        break;
      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`API error for ${tool}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
