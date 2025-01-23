import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({
  fonts: {
    heading: 'var(--font-geist-sans)',
    body: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  styles: {
    global: {
      body: {
        bg: '#f7fafc',
      },
    },
  },
}) 