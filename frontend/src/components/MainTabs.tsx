import { Tabs, TabList, TabPanels, Tab, TabPanel, Box } from '@chakra-ui/react';
import { VerifyOrganization } from './VerifyOrganization';

interface MainTabsProps {
  proof: any;
  decodedJwt: {
    rawJwt: string;
    header: any;
    payload: any;
    signature: string;
  } | null;
  onJWTReceived: (jwt: string) => void;
}

export function MainTabs({ proof, decodedJwt, onJWTReceived }: MainTabsProps) {
  return (
    <Tabs variant="enclosed">
      <TabList>
        <Tab>Verify Organization</Tab>
        <Tab>Reports</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <VerifyOrganization 
            proof={proof} 
            decodedJwt={decodedJwt} 
            onJWTReceived={onJWTReceived}
            onVerificationSuccess={() => {
              // Handle verification success if needed
            }} 
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
} 