interface CredentialResponse {
  credential: string;
}

interface Google {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: string;
          size: string;
        }
      ) => void;
    };
  };
}

interface Window {
  google?: Google;
}

export {} 