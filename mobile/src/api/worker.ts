import { api } from './client';
import type { Issue } from './types';

export const fetchAssignedIssues = async (workerId: number) => {
  const response = await api.get('/issues/assigned', { params: { workerId } });
  return response.data as Issue[];
};

export const markIssueInProgress = async (issueId: number, workerId: number) => {
  const response = await api.put(`/issues/${issueId}/in-progress`, { workerId });
  return response.data as Issue;
};

export const markIssueCompleted = async (issueId: number, workerId: number) => {
  const response = await api.put(`/issues/${issueId}/completed`, { workerId });
  return response.data as Issue;
};

export const uploadCompletionPhoto = async (payload: {
  issueId: number;
  workerId: number;
  photoUri: string;
  fileName: string;
  fileType: string;
  note?: string;
}) => {
  const formData = new FormData();
  formData.append('workerId', String(payload.workerId));
  if (payload.note) {
    formData.append('completionNote', payload.note);
  }
  formData.append('completionPhoto', {
    uri: payload.photoUri,
    name: payload.fileName,
    type: payload.fileType,
  } as any);

  const response = await api.post(`/issues/${payload.issueId}/completion-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data as Issue;
};
