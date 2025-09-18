import { createApiClientWithToken } from './client';
import type { Submission, SubmissionContent } from '@/lib/types';

export const SubmissionsApi = {
  async list(params?: { questId?: string; userId?: string }, token?: string): Promise<Submission[]> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/submissions', { params });
    return data;
  },
  
  async getUserCompletions(token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/user/completions');
    return data;
  },
  async getQuestCompletions(token?: string): Promise<any> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/quest-completions/submissions');
    return data;
  },
  async submit(questId: string, content: SubmissionContent, token?: string): Promise<Submission> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.post(`/quests/${questId}/submissions`, { content });
    return data;
  },
  async review(
    submissionId: string,
    payload: { status: 'approved' | 'rejected' | 'needs-revision'; feedback?: string; points?: number },
    token?: string
  ): Promise<Submission> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;

    // Use the correct endpoint and HTTP method based on the status
    let endpoint: string;
    let response: any;

    if (payload.status === 'approved') {
      endpoint = `/quest-completions/completions/${submissionId}/validate`;
      response = await apiClient.put(endpoint, payload);
    } else if (payload.status === 'rejected') {
      endpoint = `/quest-completions/completions/${submissionId}/reject`;
      response = await apiClient.put(endpoint, payload);
    } else {
      // For needs-revision, use the original review endpoint
      endpoint = `/submissions/${submissionId}/review`;
      response = await apiClient.post(endpoint, payload);
    }

    return response.data;
  },

  async getStats(token?: string): Promise<{ success: boolean; data: { completed: number; pending: number; total: number; rejected: number } }> {
    const apiClient = token ? createApiClientWithToken(token) : require('./client').api;
    const { data } = await apiClient.get('/admin/stats/completion');
    return data;
  }
};


