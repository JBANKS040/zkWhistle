'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { theme } from '@/theme';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CONFIG } from '@/config/google';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    disable_session_recording: true,
    capture_pageview: false
  });
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <GoogleOAuthProvider clientId={GOOGLE_CONFIG.clientId}>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </GoogleOAuthProvider>
    </PostHogProvider>
  );
} 