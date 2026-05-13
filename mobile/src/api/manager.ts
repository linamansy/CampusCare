import { api } from './client';
import type { Issue, UserProfile } from './types';

export interface ManagerAnalyticsResponse {
  summary: {
    totalIssues: number;
    resolvedIssues: number;
    rejectedIssues: number;
    underReviewIssues: number;
    assignedIssues: number;
    unassignedIssues: number;
    activeWorkers: number;
  };
  issuesByPriority: { priority: string; count: number }[];
  issuesByStatus: { status: string; count: number }[];
}

export const fetchManagerIssues = async () => {
  const response = await api.get('/manager/issues');
  return response.data as Issue[];
};

export const filterManagerIssues = async (filters: Record<string, string>) => {
  const response = await api.get('/manager/issues/filter', { params: filters });
  return response.data as Issue[];
};

export const searchManagerIssues = async (query: string) => {
  const response = await api.get('/manager/issues/search', { params: { q: query } });
  return response.data as Issue[];
};

export const fetchManagerAnalytics = async () => {
  const response = await api.get('/manager/analytics');
  return response.data as ManagerAnalyticsResponse;
};

export const assignIssue = async (issueId: number, workerId: number) => {
  const response = await api.put(`/manager/issues/${issueId}/assign`, { workerId });
  return response.data.issue as Issue;
};

export const updateIssuePriority = async (issueId: number, priority: string) => {
  const response = await api.put(`/manager/issues/${issueId}/priority`, { priority });
  return response.data.issue as Issue;
};

export const updateIssueStatus = async (issueId: number, status: string) => {
  const response = await api.put(`/manager/issues/${issueId}/status`, { status });
  return response.data.issue as Issue;
};

export const resolveIssue = async (issueId: number) => {
  const response = await api.put(`/manager/issues/${issueId}/resolve`);
  return response.data.issue as Issue;
};

export const rejectIssue = async (issueId: number, reason: string) => {
  const response = await api.put(`/manager/issues/${issueId}/reject`, { reason });
  return response.data.issue as Issue;
};

export const requestRework = async (issueId: number, reason: string) => {
  const response = await api.put(`/manager/issues/${issueId}/rework`, { reason });
  return response.data.issue as Issue;
};

export const fetchWorkers = async () => {
  const response = await api.get('/manager/workers');
  return response.data as UserProfile[];
};

export const fetchWorkerProfile = async (workerId: number) => {
  const response = await api.get(`/manager/workers/${workerId}`);
  return response.data as { worker: UserProfile; assignedIssues: Issue[] };
};

export const activateWorker = async (workerId: number) => {
  const response = await api.put(`/manager/workers/${workerId}/activate`);
  return response.data.worker as UserProfile;
};

export const deactivateWorker = async (workerId: number) => {
  const response = await api.put(`/manager/workers/${workerId}/deactivate`);
  return response.data.worker as UserProfile;
};
