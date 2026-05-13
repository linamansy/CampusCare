import type { Issue, UserProfile } from '../api/types';

export interface LeaderboardEntry {
  userId: number;
  name: string;
  role: string;
  score: number;
  resolved?: number;
}

export const buildMemberLeaderboard = (issues: Issue[]) => {
  const tally = new Map<number, LeaderboardEntry>();

  issues.forEach((issue) => {
    if (!issue.user) {
      return;
    }

    const existing = tally.get(issue.user.id);
    const entry = existing || {
      userId: issue.user.id,
      name: issue.user.name,
      role: issue.user.role,
      score: 0,
    };

    entry.score += 1;
    tally.set(entry.userId, entry);
  });

  return Array.from(tally.values()).sort((a, b) => b.score - a.score);
};

export const buildWorkerLeaderboard = (issues: Issue[], workers: UserProfile[]) => {
  const tally = new Map<number, LeaderboardEntry>();

  issues.forEach((issue) => {
    if (!issue.assignedTo) {
      return;
    }

    const existing = tally.get(issue.assignedTo);
    const entry = existing || {
      userId: issue.assignedTo,
      name: workers.find((worker) => worker.id === issue.assignedTo)?.name || `Worker ${issue.assignedTo}`,
      role: 'Worker',
      score: 0,
      resolved: 0,
    };

    if (issue.status === 'Resolved' || issue.status === 'Completed') {
      entry.resolved = (entry.resolved || 0) + 1;
      entry.score += 2;
    } else {
      entry.score += 1;
    }

    tally.set(entry.userId, entry);
  });

  return Array.from(tally.values()).sort((a, b) => b.score - a.score);
};
