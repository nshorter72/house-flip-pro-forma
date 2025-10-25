import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    // Polyfill window.storage using localStorage when missing (keeps your original component unchanged)
    if (!(window as any).storage) {
      (window as any).storage = {
        list: async (prefix = '') => {
          try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
            return { keys };
          } catch (e) {
            return { keys: [] };
          }
        },
        get: async (key: string) => {
          try {
            const value = localStorage.getItem(key);
            return { value };
          } catch (e) {
            return { value: null };
          }
        },
        set: async (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
            return true;
          } catch (e) {
            return false;
          }
        }
      };
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
