import type { Metadata } from 'next'
import { ChakraProvider } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import localFont from 'next/font/local'
import './globals.css'
import { CSPostHogProvider } from './providers'
import PostHogPageView from "./PostHogPageView"
import { GOOGLE_CONFIG } from '@/config/google'

// Load custom fonts
const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'JWT-Wallet',
  description: 'A simple JWT wallet application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <CSPostHogProvider>
          <PostHogPageView />
          <GoogleOAuthProvider clientId={GOOGLE_CONFIG.clientId}>
            <ChakraProvider>{children}</ChakraProvider>
          </GoogleOAuthProvider>
        </CSPostHogProvider>
      </body>
    </html>
  )
} 