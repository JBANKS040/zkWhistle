import { theme as baseTheme } from '@chakra-ui/theme'
import { extendTheme as chakraExtendTheme } from '@chakra-ui/theme-utils'

export const theme = chakraExtendTheme({
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
}, baseTheme) 