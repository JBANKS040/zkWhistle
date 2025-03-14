'use client'

import { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Button, FormControl, FormLabel, Input, Textarea, useToast, Divider } from '@chakra-ui/react';
import { GoogleSignIn } from './GoogleSignIn';
import { ProofStatus } from './ProofStatus';
import { generateProofForReport } from '@/helpers/proof-utils';
import { submitReport, getReport, getOrganizationName } from '@/helpers/contract-utils';
import { Report } from '@/types/report';
import { publicClient } from '@/lib/ethers';
import { ZKWHISTLEBLOWER_CONTRACT } from '@/config/contracts';
import { HashedDomainsType } from '@/types/hashedDomains';
import HashedDomains from '@/config/HashedDomains.json';

enum FlowStep {
  ENTER_REPORT = 0,
  LOGIN = 1,
  GENERATE_PROOF = 2,
  SUBMIT = 3,
  COMPLETE = 4
}

export function ReportFlow() {
  const [step, setStep] = useState<FlowStep>(FlowStep.ENTER_REPORT);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [jwt, setJwt] = useState<string | null>(null);
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [decodedJwt, setDecodedJwt] = useState<any>(null);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const toast = useToast();

  // Move to next step when conditions are met
  useEffect(() => {
    if (jwt && step === FlowStep.LOGIN) {
      handleProofGeneration();
    }
  }, [jwt]);

  // Effect to fetch all reports
  useEffect(() => {
    fetchAllReports();
  }, []);

  // Effect to fetch a specific report after submission
  useEffect(() => {
    if (submittedReport) {
      fetchAllReports();
    }
  }, [submittedReport]);

  // Add specific effect to re-fetch reports after submission confirmation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (step === FlowStep.COMPLETE) {
      // Fetch immediately
      fetchAllReports();
      
      // And then again after a few seconds (transaction might need time to be indexed)
      timeoutId = setTimeout(() => {
        console.log('Fetching reports again after timeout...');
        fetchAllReports();
      }, 5000); // 5 seconds
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [step]); // Only depend on step to avoid loop

  // Function to fetch all reports
  const fetchAllReports = async () => {
    try {
      console.log('Fetching all reports...');
      
      // Get total report count from contract with retry
      let count = 0n;
      let retries = 3;
      
      while (retries > 0) {
        try {
          count = await publicClient.readContract({
            ...ZKWHISTLEBLOWER_CONTRACT,
            functionName: 'reportCount'
          }) as bigint;
          
          console.log(`Found ${count} reports`);
          break;
        } catch (error) {
          console.warn(`Error fetching report count, retrying... (${retries} attempts left)`);
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      if (count === 0n) {
        setReportsList([]);
        return;
      }
      
      // Create an array of promises to fetch each report
      const reportPromises = [];
      for (let i = 0; i < Number(count); i++) {
        reportPromises.push(getReport(BigInt(i)));
      }
      
      // Wait for all reports to be fetched
      const reports = await Promise.all(reportPromises);
      console.log('Fetched reports:', reports);
      setReportsList(reports);
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error fetching reports",
        description: String(error),
        status: "error",
        duration: 3000,
      });
    }
  };

  // Handle Google JWT reception
  const handleJwtReceived = (token: string) => {
    try {
      // Decode JWT parts
      const [headerB64, payloadB64, signature] = token.split('.');
      const header = JSON.parse(atob(headerB64));
      const payload = JSON.parse(atob(payloadB64));
      
      setJwt(token);
      setDecodedJwt({
        rawJwt: token,
        header,
        payload,
        signature
      });
      
      toast({
        title: "Google login successful",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error processing JWT:', error);
      toast({
        title: "Failed to process JWT",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Generate proof using JWT and report content
  const handleProofGeneration = async () => {
    if (!jwt || !title || !content) return;
    
    setLoading(true);
    setStep(FlowStep.GENERATE_PROOF);
    
    try {
      // Store the report details in state to prevent any changes
      const finalTitle = title.trim();
      const finalContent = content.trim();
      
      // Update state with trimmed values
      setTitle(finalTitle);
      setContent(finalContent);
      
      console.log('Generating proof with report details (EXACT VALUES):', {
        title: finalTitle,
        content: finalContent,
        contentLength: finalContent.length
      });
      
      const generatedProof = await generateProofForReport(jwt, finalTitle, finalContent);
      
      // Store the exact proof that was generated
      setProof({
        ...generatedProof,
        originalTitle: finalTitle,
        originalContent: finalContent
      });
      
      setStep(FlowStep.SUBMIT);
    } catch (error) {
      console.error('Error generating proof:', error);
      toast({
        title: "Failed to generate proof",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle proof verification and report submission
  const handleSubmitReport = async (txHash: string) => {
    if (!proof || !title || !content) return;
    
    setLoading(true);
    try {
      console.log('Submitting report with details:', {
        title,
        contentLength: content.length,
        txHash
      });
      
      let result;
      try {
        result = await submitReport(
          title, 
          content, 
          proof.proof, 
          proof.publicSignals
        );
      } catch (submitError) {
        // If the error message mentions "proof already used" but we have a transaction hash
        if (String(submitError).includes('Proof already used') && txHash) {
          console.warn('Got "Proof already used" error but transaction exists:', txHash);
          
          toast({
            title: "Transaction Pending",
            description: "Your report appears to be submitted. Checking status...",
            status: "info",
            duration: 5000,
          });
          
          // Force a move to complete state and refresh reports
          setStep(FlowStep.COMPLETE);
          // Clear the proof to prevent reuse
          setProof(null);
          
          // Fetch reports to see if it shows up
          setTimeout(fetchAllReports, 3000);
          return;
        }
        
        // Rethrow if it's not the specific error we're handling
        throw submitError;
      }
      
      // Extract the transaction hash and report ID
      const { reportId, transactionHash } = result;
      console.log(`Report ID: ${reportId}, Transaction Hash: ${transactionHash}`);
      
      toast({
        title: "Report submitted successfully",
        description: `Report ID: ${reportId}`,
        status: "success",
        duration: 5000,
      });
      
      setStep(FlowStep.COMPLETE);
      
      // IMPORTANT: Clear the proof after submission to prevent reuse
      setProof(null);
      
      // Save the submitted report to state for display
      setSubmittedReport({
        title: proof?.originalTitle || title,
        content: proof?.originalContent || content,
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        organizationHash: proof.publicSignals.organization_hash
      });

      // Refetch all reports after submission
      fetchAllReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Failed to submit report",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToLogin = () => {
    if (!title || !content) {
      toast({
        title: "Please fill in all fields",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setStep(FlowStep.LOGIN);
  };

  return (
    <VStack spacing={8} w="full" maxW="2xl" mx="auto">
      <Heading>Submit Anonymous Reports About Your Organization</Heading>
      
      {/* Step 1: Enter report details */}
      <VStack spacing={4} w="full" opacity={step > FlowStep.ENTER_REPORT ? 0.7 : 1}>
        <Heading size="md">Step 1: Enter Report Details</Heading>
        <FormControl isRequired isDisabled={step > FlowStep.ENTER_REPORT}>
          <FormLabel>Report Title</FormLabel>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a clear, descriptive title"
          />
        </FormControl>
        
        <FormControl isRequired isDisabled={step > FlowStep.ENTER_REPORT}>
          <FormLabel>Report Content</FormLabel>
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={6}
          />
        </FormControl>
        
        {step === FlowStep.ENTER_REPORT && (
          <Button 
            colorScheme="blue" 
            onClick={handleContinueToLogin}
            isDisabled={!title || !content}
            w="full"
          >
            Continue to Authentication
          </Button>
        )}
      </VStack>
      
      {/* Step 2: Login with Google */}
      {step >= FlowStep.LOGIN && (
        <>
          <Divider />
          <VStack spacing={4} w="full" opacity={step > FlowStep.LOGIN ? 0.7 : 1}>
            <Heading size="md">Step 2: Verify Your Organization</Heading>
            {step === FlowStep.LOGIN && !jwt && (
              <Box pt={4}>
                <GoogleSignIn onJWTReceived={handleJwtReceived} />
              </Box>
            )}
          </VStack>
        </>
      )}
      
      {/* Step 3 & 4: Proof Generation and Submission */}
      {step >= FlowStep.GENERATE_PROOF && (
        <>
          <Divider />
          <VStack spacing={4} w="full">
            <Heading size="md">
              {step === FlowStep.GENERATE_PROOF ? "Step 3: Generating Proof (up to 1 minute)" : 
               step === FlowStep.SUBMIT ? "Step 4: Submit Report" : 
               "Report Verified"}
            </Heading>
            
            <ProofStatus 
              proof={proof} 
              onSubmitComplete={handleSubmitReport}
              title={proof?.originalTitle || title}
              content={proof?.originalContent || content}
            />
          </VStack>
        </>
      )}
      
      {/* Step 5: Display submitted report */}
      {step === FlowStep.COMPLETE && (
        <>
          <Divider />
          <VStack spacing={4} w="full">
            <Heading size="md">Report Submitted Successfully</Heading>
            <Text>Your anonymous report has been submitted and verified!</Text>
            
            <Button 
              colorScheme="blue" 
              onClick={() => {
                // Complete reset of all state
                setStep(FlowStep.ENTER_REPORT);
                setTitle('');
                setContent('');
                setJwt(null);
                setProof(null);
                setDecodedJwt(null);
                // Clear any browser storage if you're storing state there
                localStorage.removeItem('whistleblower_proof');
                sessionStorage.removeItem('whistleblower_proof');
              }}
            >
              Submit Another Report
            </Button>
          </VStack>
          
          {/* Display the submitted report */}
          {submittedReport && (
            <VStack spacing={4} w="full" mt={6} p={4} borderWidth={1} borderRadius="md">
              <Text fontWeight="medium" color="blue.600">
                Organization: {getOrganizationName(submittedReport.organizationHash)}
              </Text>
              <Heading size="sm">{submittedReport.title}</Heading>
              <Text fontSize="sm">{submittedReport.content}</Text>
              <Text fontSize="xs" color="gray.500">
                Submitted at: {new Date(Number(submittedReport.timestamp) * 1000).toLocaleString()}
              </Text>
            </VStack>
          )}
        </>
      )}
      
      {/* Display all reports - sort by timestamp in descending order */}
      {reportsList.length > 0 && (
        <VStack spacing={4} w="full" mt={8}>
          <Divider />
          <Heading size="md">Verified Reports</Heading>
          {reportsList
            .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)) // Sort newest first
            .map((report, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md" w="full">
                <Text fontWeight="medium" color="blue.600">
                  Organization: {getOrganizationName(report.organizationHash)}
                </Text>
                <Heading size="sm" mt={2}>{report.title}</Heading>
                <Text mt={2}>{report.content}</Text>
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Submitted: {new Date(Number(report.timestamp) * 1000).toLocaleString()}
                </Text>
              </Box>
            ))}
        </VStack>
      )}
    </VStack>
  );
} 