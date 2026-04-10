import { google } from 'googleapis';
import { YouTubeStats } from './types';

export async function fetchYouTubeStats(accessToken: string): Promise<YouTubeStats> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({ version: 'v3', auth });

  try {
    // Subscriptions
    const subsRes = await youtube.subscriptions.list({
      part: ['snippet'],
      mine: true,
      maxResults: 50,
    });
    const totalSubscriptions = subsRes.data.pageInfo?.totalResults || 0;

    // Liked videos
    const likedRes = await youtube.videos.list({
      part: ['snippet'],
      myRating: 'like',
      maxResults: 50,
    });
    const totalLikedVideos = likedRes.data.pageInfo?.totalResults || 0;

    // Top channels from subscriptions
    const topChannels: Record<string, number> = {};
    const categoryDist: Record<string, number> = {};

    const subs = subsRes.data.items || [];
    for (const sub of subs) {
      const channelTitle = sub.snippet?.title || 'Unknown';
      topChannels[channelTitle] = (topChannels[channelTitle] || 0) + 1;
    }

    return {
      totalSubscriptions,
      totalLikedVideos,
      watchHistory: [],
      topChannels: Object.entries(topChannels)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      categoryDistribution: Object.entries(categoryDist)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    console.error('YouTube API error:', error);
    return { totalSubscriptions: 0, totalLikedVideos: 0, watchHistory: [], topChannels: [], categoryDistribution: [] };
  }
}
