import { Platform } from 'react-native';
import { api } from './client';
import type { Issue, IssueComment } from './types';

export const fetchAllIssues = async () => {
  const response = await api.get('/issues');
  return response.data.data as Issue[];
};

export const fetchMyIssues = async () => {
  const response = await api.get('/issues/my');
  return response.data.data as Issue[];
};

export const fetchIssueById = async (id: number) => {
  const response = await api.get(`/issues/${id}`);
  return response.data.data as Issue;
};

import { uploadImageToSupabase } from './supabaseClient';

export const createIssue = async (payload: {
  title: string;
  description: string;
  category: string;
  building: string;
  floor: string;
  room: string;
  location?: string;
  imageUri: string;
  imageName: string;
  imageType: string;
}) => {
  console.log('[API] Creating issue with direct Supabase upload...');
  
  // 1. Upload to Supabase first
  const extension = payload.imageName.split('.').pop() || 'jpg';
  const supabasePath = `issues/${Date.now()}-${Math.round(Math.random() * 1e7)}.${extension}`;
  
  const imageUrl = await uploadImageToSupabase(
    payload.imageUri,
    supabasePath,
    payload.imageType
  );
  
  console.log('[API] Image uploaded to Supabase:', imageUrl);

  // 2. Send the URL to our backend as a regular JSON request
  const response = await api.post('/issues', {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    building: payload.building,
    floor: payload.floor,
    room: payload.room,
    location: payload.location || `${payload.building} - Floor ${payload.floor} - Room ${payload.room}`,
    imageUrl: imageUrl
  });

  return response.data.data as Issue;
};

export const addIssueComment = async (issueId: number, text: string) => {
  const response = await api.post(`/issues/${issueId}/comments`, { text });
  return response.data.data as IssueComment;
};

export const verifyResolution = async (issueId: number) => {
  const response = await api.post(`/issues/${issueId}/verify`);
  return response.data.data as Issue;
};
