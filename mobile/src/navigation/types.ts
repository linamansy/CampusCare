import type { Issue } from '@/src/services/api';

export type WorkerStackParamList = {
  AssignedIssues: undefined;
  IssueWork: {
    issue: Issue;
  };
};
