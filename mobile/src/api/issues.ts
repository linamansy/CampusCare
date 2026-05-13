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
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);
  formData.append('category', payload.category);
  formData.append('building', payload.building);
  formData.append('floor', payload.floor);
  formData.append('room', payload.room);
  formData.append('location', payload.location || `${payload.building} - Floor ${payload.floor} - Room ${payload.room}`);
  formData.append('image', {
    uri: payload.imageUri,
    name: payload.imageName,
    type: payload.imageType,
  } as any);

  const response = await api.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
