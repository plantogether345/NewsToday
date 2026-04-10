import { google } from 'googleapis';
import { TasksStats, TimeSeriesData } from './types';

export async function fetchTasksStats(accessToken: string): Promise<TasksStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const tasks = google.tasks({ version: 'v1', auth });

  try {
    const taskListsRes = await tasks.tasklists.list({ maxResults: 20 });
    const taskLists = taskListsRes.data.items || [];

    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    const tasksByList: { list: string; total: number; completed: number }[] = [];
    const tasksByDueDate: Record<string, number> = {};

    for (const list of taskLists) {
      try {
        const tasksRes = await tasks.tasks.list({
          tasklist: list.id!,
          maxResults: 100,
          showCompleted: true,
          showHidden: true,
        });

        const items = tasksRes.data.items || [];
        let listCompleted = 0;
        let listTotal = items.length;

        for (const task of items) {
          totalTasks++;
          if (task.status === 'completed') {
            completedTasks++;
            listCompleted++;
          } else {
            pendingTasks++;
            if (task.due) {
              const dueDate = new Date(task.due);
              if (dueDate < new Date()) overdueTasks++;
            }
          }

          if (task.due) {
            const dayKey = task.due.split('T')[0];
            tasksByDueDate[dayKey] = (tasksByDueDate[dayKey] || 0) + 1;
          }
        }

        tasksByList.push({
          list: list.title || 'Unknown',
          total: listTotal,
          completed: listCompleted,
        });
      } catch {
        // Skip inaccessible lists
      }
    }

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      tasksByList,
      tasksByDueDate: Object.entries(tasksByDueDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      overdueTasks,
    };
  } catch (error) {
    console.error('Tasks API error:', error);
    return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, tasksByList: [], tasksByDueDate: [], overdueTasks: 0 };
  }
}
