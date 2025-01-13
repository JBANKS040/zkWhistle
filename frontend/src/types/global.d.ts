interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string | undefined
          callback: (response: { credential: string }) => void
        }) => void
        renderButton: (
          element: HTMLElement | null,
          config: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
          }
        ) => void
        prompt: () => void
      }
    }
  }
} 