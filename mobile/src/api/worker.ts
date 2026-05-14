import { Platform } from 'react-native';
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

import { uploadImageToSupabase } from './supabaseClient';

export const uploadCompletionPhoto = async (payload: {
  issueId: number;
  workerId: number;
  photoUri: string;
  fileName: string;
  fileType: string;
  note?: string;
}) => {
  console.log('[API] Uploading completion photo via direct Supabase path...');

  // 1. Upload to Supabase first
  const extension = payload.fileName.split('.').pop() || 'jpg';
  const supabasePath = `completion-photos/${Date.now()}-${Math.round(Math.random() * 1e7)}.${extension}`;
  
  const imageUrl = await uploadImageToSupabase(
    payload.photoUri,
    supabasePath,
    payload.fileType
  );

  console.log('[API] Completion photo uploaded:', imageUrl);

  // 2. Send to backend as JSON
  const response = await api.post(`/issues/${payload.issueId}/completion-photo`, {
    workerId: payload.workerId,
    completionNote: payload.note,
    imageUrl: imageUrl
  });

  return response.data as Issue;
};
