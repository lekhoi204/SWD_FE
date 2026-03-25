/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_DOCS?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          redirect_uri?: string;
          callback: (resp: { access_token?: string; error?: string }) => void;
        }) => {
          requestAccessToken: (overrideConfig?: { prompt: string }) => void;
        };
      };
    };
  };
}
