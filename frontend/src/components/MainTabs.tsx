import { Tabs, TabList, TabPanels, Tab, TabPanel, Box, useToast } from '@chakra-ui/react';
import { VerifyOrganization } from './VerifyOrganization';
import { ReportSubmission } from './ReportSubmission';
import { useState, useEffect } from 'react';
import { getVerifiedOrganization } from '@/helpers/contract-utils';

interface MainTabsProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
  publicSignals: any;
  onJWTReceived: (jwt: string) => void;
}

export function MainTabs({ proof, decodedJwt, publicSignals, onJWTReceived }: MainTabsProps) {
  const [isVerified, setIsVerified] = useState(false);
  const toast = useToast();

  // Check verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts[0]) {
            const orgHash = await getVerifiedOrganization(accounts[0]);
            setIsVerified(orgHash !== BigInt(0));
          }
        } catch (error) {
          console.error('Error checking verification:', error);
        }
      }
    };

    checkVerification();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <Tabs variant="enclosed" isLazy>
      <TabList>
        <Tab>Verify Organization</Tab>
        <Tab>Reports</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <VerifyOrganization 
            proof={proof} 
            decodedJwt={decodedJwt} 
            publicSignals={publicSignals}
            onJWTReceived={onJWTReceived}
            onVerificationSuccess={() => {
              setIsVerified(true);
              toast({
                title: "Organization verified",
                description: "You can now submit reports",
                status: "success",
                duration: 5000,
                isClosable: true,
              });
            }} 
          />
        </TabPanel>
        <TabPanel>
          <ReportSubmission 
            onSuccess={(reportId) => {
              toast({
                title: "Report submitted",
                description: `Report ID: ${reportId}`,
                status: "success",
                duration: 5000,
                isClosable: true,
              });
            }}
            onError={(error) => {
              toast({
                title: "Error submitting report",
                description: error.message,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
            }}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
} 