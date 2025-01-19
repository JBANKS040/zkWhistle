interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  locale?: string;
  logo_alignment?: 'left' | 'center';
  width?: number | string;
  local?: string;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement | null,
        options: GoogleButtonOptions
      ) => void;
      prompt: () => void;
      disableAutoSelect: () => void;
    };
  };
}

// Extend the global Window interface
declare global {
  interface Window {
    google?: Google;
  }
}

export type { GoogleCredentialResponse, GoogleButtonOptions, Google }; 