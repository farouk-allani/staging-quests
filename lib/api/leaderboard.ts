import { api, createApiClientWithToken } from './client';
import type { LeaderboardResponse } from '@/lib/types';

export const LeaderboardApi = {
  async getLeaderboard(token?: string): Promise<LeaderboardResponse> {
    const apiClient = token ? createApiClientWithToken(token) : api;
    const response = await apiClient.get('/user/leaderboard');
    return response.data;
  }
};


