'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { usePostHog } from 'posthog-js/react'
import dynamic from 'next/dynamic'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog?.capture('$pageview', {
        '$current_url': url
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}

// Export with dynamic to prevent hydration issues
export default dynamic(() => Promise.resolve(PostHogPageView), {
  ssr: false
}) 