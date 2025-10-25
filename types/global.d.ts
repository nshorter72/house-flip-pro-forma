declare global {
  interface Window {
    storage?: {
      list?: (prefix?: string) => Promise<{ keys: string[] }>;
      get?: (key: string) => Promise<{ value: string | null }>;
      set?: (key: string, value: string) => Promise<void>;
    };
  }
}

export {};
