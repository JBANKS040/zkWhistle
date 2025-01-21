export interface Report {
  title: string;
  content: string;
  timestamp: number;
  whistleblower: string;
  organizationHash: bigint;
  organizationName: string;
}

export interface ReportSubmission {
  organizationHash: bigint;
  organizationName: string;
  title: string;
  content: string;
} 