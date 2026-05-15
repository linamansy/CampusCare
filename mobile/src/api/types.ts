export type UserRole = 'Community Member' | 'Facility Manager' | 'Worker' | 'Admin';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  points?: number;
  actsOfServicePoints?: number;
}

export interface CompletionAttempt {
  id: number;
  issueId: number;
  workerId: number;
  photoUrl?: string | null;
  note?: string | null;
  createdAt?: string;
  worker?: { id: number; name: string };
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  location: string;
  building?: string;
  floor?: string;
  room?: string;
  image?: string | null;
  completionPhotoUrl?: string | null;
  completionNote?: string | null;
  rejectionReason?: string | null;
  assignedTo?: number | null;
  verifiedBy?: number | null;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  user?: UserProfile;
  comments?: IssueComment[];
  completionAttempts?: CompletionAttempt[];
}

export interface IssueComment {
  id: number;
  text: string;
  userId?: number;
  createdAt?: string;
  user?: Pick<UserProfile, 'id' | 'name' | 'role'>;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  issueId?: number | null;
  createdAt?: string;
}
