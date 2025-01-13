'use client'

import { GoogleLogin } from '@react-oauth/google'
import { useState, useEffect } from 'react'

interface Props {
  onJWTReceived: (jwt: string) => void
}

export function GoogleSignIn({ onJWTReceived }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSuccess = (response: any) => {
    console.log('Google login success:', response)
    if (response?.credential) {
      console.log('Received credential:', response.credential)
      onJWTReceived(response.credential)
    } else {
      console.error('No credential received')
      setError('Login failed: No credential received')
    }
  }

  const handleError = () => {
    console.error('Google login failed')
    setError('Login failed. Please try again.')
  }

  if (!mounted) return null

  return (
    <div>
      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        auto_select={false}
        theme="filled_black"
        text="signin_with"
        shape="rectangular"
        locale="en"
      />
    </div>
  )
} 