import { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Textarea, VStack, Text, useToast, Heading } from '@chakra-ui/react';
import { submitReport, getVerifiedOrganization, getReport, getOrganizationName } from '@/helpers/contract-utils';
import type { Report } from '@/types/report';
import { publicClient } from '@/lib/ethers';
import { REPORT_CONTRACT } from '@/config/contracts';

interface ReportSubmissionProps {
  onSuccess?: (reportId: bigint) => void;
  onError?: (error: Error) => void;
}

export function ReportSubmission({ onSuccess, onError }: ReportSubmissionProps) {
  const [report, setReport] = useState<Partial<Report>>({
    title: '',
    content: ''
  });
  const [submittedReports, setSubmittedReports] = useState<(Report & { organizationName: string })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'initial' | 'success' | 'error'>('initial');
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [verifiedOrg, setVerifiedOrg] = useState<string>('');
  const toast = useToast();

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const getVerifiedOrg = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts[0]) {
          const orgHash = await getVerifiedOrganization(accounts[0]);
          const orgName = await getOrganizationName(orgHash);
          setVerifiedOrg(orgName || '');
        }
      }
    };
    getVerifiedOrg();
  }, []);

  const loadReports = async () => {
    try {
      const reportCount = await publicClient.readContract({
        ...REPORT_CONTRACT,
        functionName: 'reportCount'
      });

      const reports = [];
      for (let i = 0; i < Number(reportCount); i++) {
        const report = await getReport(BigInt(i));
        const orgName = await getOrganizationName(report.organizationHash);
        reports.push({ ...report, organizationName: orgName });
      }
      setSubmittedReports(reports.map(report => ({
        ...report,
        organizationName: report.organizationName || 'Unknown Organization'
      })));
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if connected
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Wallet not connected');
      }

      // Get current account
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts[0]) {
        throw new Error('No account selected');
      }

      // Verify organization status
      const orgHash = await getVerifiedOrganization(accounts[0]);
      if (orgHash === BigInt(0)) {
        throw new Error('Organization not verified');
      }

      // Submit report
      console.log('Submitting report:', { title: report.title, content: report.content });
      const reportId = await submitReport(report.title!, report.content!);
      const submitted = await getReport(reportId);
      const orgName = await getOrganizationName(submitted.organizationHash);
      
      setSubmittedReports(prev => [...prev, { ...submitted, organizationName: orgName || 'Unknown Organization' }]);
      setReport({ title: '', content: '' });
      onSuccess?.(reportId);
      
      toast({
        title: 'Report Submitted',
        description: `Report ID: ${reportId.toString()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSubmissionStatus('success');
    } catch (error) {
      console.error('Failed to submit report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(new Error(errorMessage));
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <VStack spacing={4}>
        <FormControl mb={4}>
          <FormLabel>Your verified organization</FormLabel>
          <Input
            value={verifiedOrg}
            isReadOnly
            bg="gray.50"
            _hover={{ cursor: 'not-allowed' }}
          />
        </FormControl>

        <Box as="form" onSubmit={handleSubmit} width="full">
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Report Title</FormLabel>
              <Input
                value={report.title}
                onChange={(e) => setReport(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter report title"
                minLength={1}
                maxLength={100}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Report Content</FormLabel>
              <Textarea
                value={report.content}
                onChange={(e) => setReport(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe the issue in detail..."
                rows={6}
                minLength={1}
                maxLength={1000}
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isSubmitting}
              loadingText="Submitting..."
              width="full"
              mt={4}
              isDisabled={!report.title || !report.content}
            >
              Submit Report
            </Button>
          </VStack>
        </Box>
        
        {submittedReports
          .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)) // Sort by newest first
          .map((report, index) => (
            <Box key={index} borderWidth="1px" p={4} borderRadius="md" width="full" bg="white" shadow="md">
              <VStack align="start" spacing={2}>
                <Heading size="lg">{report.title}</Heading>
                <Text><strong>Organization:</strong> {report.organizationName}</Text>
                <Text><strong>Timestamp:</strong> {new Date(Number(report.timestamp) * 1000).toLocaleString()}</Text>
                <Text><strong>Content:</strong> {report.content}</Text>
              </VStack>
            </Box>
          ))}
      </VStack>
    </Box>
  );
} 