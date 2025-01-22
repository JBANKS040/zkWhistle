export type Report = {
  title: string;
  content: string;
  timestamp: bigint;
  organizationHash: bigint;
}

export interface ReportSubmission {
  organizationHash: bigint;
  organizationName: string;
  title: string;
  content: string;
} 