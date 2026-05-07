import axios from 'axios';

export interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  assignedTo?: string;
  createdAt?: string;
}

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchAssignedIssues(workerId: number): Promise<Issue[]> {
  const response = await api.get<Issue[]>('/issues/assigned', {
    params: { workerId },
  });
  return response.data;
}

export async function addComment(issueId: number, comment: string): Promise<void> {
  await api.post(`/issues/${issueId}/comments`, { comment });
}

export async function markIssueInProgress(issueId: number): Promise<void> {
  await api.put(`/issues/${issueId}/in-progress`);
}

export async function uploadCompletionPhoto(
  issueId: number,
  photoUri: string,
  fileName: string,
  fileType: string,
): Promise<void> {
  const formData = new FormData();
  formData.append('completionPhoto', {
    uri: photoUri,
    name: fileName,
    type: fileType,
  } as any);

  await api.post(`/issues/${issueId}/completion-photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
