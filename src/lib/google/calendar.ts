import { google } from 'googleapis';
import { CalendarStats, TimeSeriesData } from './types';

export async function fetchCalendarStats(accessToken: string): Promise<CalendarStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get calendar list
    const calendarsRes = await calendar.calendarList.list();
    const calendars = calendarsRes.data.items || [];

    const eventsByCalendar: Record<string, number> = {};
    const eventsByDay: Record<string, number> = {};
    const busyHours: Record<number, number> = {};
    const meetingDuration: Record<string, number> = { '< 30min': 0, '30-60min': 0, '1-2hr': 0, '> 2hr': 0 };
    let recurringCount = 0;
    let oneTimeCount = 0;
    const attendeeCounts: number[] = [];
    const organizerCounts: Record<string, number> = {};
    let totalEvents = 0;
    let upcomingEvents = 0;

    for (const cal of calendars.slice(0, 10)) {
      try {
        const eventsRes = await calendar.events.list({
          calendarId: cal.id!,
          timeMin: thirtyDaysAgo.toISOString(),
          timeMax: thirtyDaysFromNow.toISOString(),
          maxResults: 100,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = eventsRes.data.items || [];
        const calName = cal.summary || 'Unknown';
        eventsByCalendar[calName] = events.length;
        totalEvents += events.length;

        for (const event of events) {
          const start = event.start?.dateTime || event.start?.date;
          const end = event.end?.dateTime || event.end?.date;

          if (start) {
            const startDate = new Date(start);
            const dayKey = startDate.toISOString().split('T')[0];
            eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + 1;

            const hour = startDate.getHours();
            busyHours[hour] = (busyHours[hour] || 0) + 1;

            if (startDate > now) upcomingEvents++;

            // Duration
            if (end) {
              const endDate = new Date(end);
              const durationMin = (endDate.getTime() - startDate.getTime()) / 60000;
              if (durationMin < 30) meetingDuration['< 30min']++;
              else if (durationMin <= 60) meetingDuration['30-60min']++;
              else if (durationMin <= 120) meetingDuration['1-2hr']++;
              else meetingDuration['> 2hr']++;
            }
          }

          // Recurring
          if (event.recurringEventId) recurringCount++;
          else oneTimeCount++;

          // Attendees
          const attendees = event.attendees || [];
          attendeeCounts.push(attendees.length);

          // Organizer
          const orgName = event.organizer?.displayName || event.organizer?.email || 'Unknown';
          organizerCounts[orgName] = (organizerCounts[orgName] || 0) + 1;
        }
      } catch {
        // Skip inaccessible calendars
      }
    }

    const eventsByDayArr: TimeSeriesData[] = Object.entries(eventsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const busyHoursArr = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: busyHours[i] || 0,
    }));

    const attendeesDistribution = [
      { range: '1-2', count: attendeeCounts.filter((c) => c <= 2).length },
      { range: '3-5', count: attendeeCounts.filter((c) => c >= 3 && c <= 5).length },
      { range: '6-10', count: attendeeCounts.filter((c) => c >= 6 && c <= 10).length },
      { range: '10+', count: attendeeCounts.filter((c) => c > 10).length },
    ];

    return {
      totalEvents,
      upcomingEvents,
      eventsByDay: eventsByDayArr,
      eventsByCalendar: Object.entries(eventsByCalendar).map(([calendar, count]) => ({ calendar, count })),
      busyHours: busyHoursArr,
      meetingDuration: Object.entries(meetingDuration).map(([range, count]) => ({ range, count })),
      recurringVsOneTime: { recurring: recurringCount, oneTime: oneTimeCount },
      attendeesDistribution,
      topOrganizers: Object.entries(organizerCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  } catch (error) {
    console.error('Calendar API error:', error);
    return getDefaultCalendarStats();
  }
}

function getDefaultCalendarStats(): CalendarStats {
  return {
    totalEvents: 0,
    upcomingEvents: 0,
    eventsByDay: [],
    eventsByCalendar: [],
    busyHours: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
    meetingDuration: [],
    recurringVsOneTime: { recurring: 0, oneTime: 0 },
    attendeesDistribution: [],
    topOrganizers: [],
  };
}
