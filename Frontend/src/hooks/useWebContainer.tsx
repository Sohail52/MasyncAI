import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

interface UseWebContainerResult {
  webcontainer: WebContainer | undefined;
  error: Error | null;
  loading: boolean;
}

// Global WebContainer instance to prevent multiple boots
let globalWebContainer: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

// Function to cleanup WebContainer when app is completely closed
export function cleanupWebContainer() {
  if (globalWebContainer) {
    try {
      // WebContainer doesn't have an explicit teardown method,
      // but we can reset our global reference
      globalWebContainer = null;
      bootPromise = null;
    } catch (err) {
      console.warn('Error during WebContainer cleanup:', err);
    }
  }
}

export function useWebContainer(): UseWebContainerResult {
  const [webcontainer, setWebcontainer] = useState<WebContainer>();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  // Add debug info
  useEffect(() => {
    console.log('useWebContainer hook called');
    return () => {
      console.log('useWebContainer hook cleanup');
    };
  }, []);

  useEffect(() => {
    // Prevent multiple effect runs in development mode
    let isMounted = true;
    
    async function bootWebContainer() {
      try {
        if (!isMounted) return;
        
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Check if the browser supports SharedArrayBuffer and is cross-origin isolated
        if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
          console.warn('Cross-origin isolation is not enabled. WebContainer might not work correctly.');
        }

        // Check for potential preload issues
        if (typeof window !== 'undefined') {
          const preloadLinks = document.querySelectorAll('link[rel="preload"]');
          if (preloadLinks.length > 0) {
            console.log('Preload links detected:', preloadLinks.length);
          }
        }

        // Check if we're in a development environment that might cause issues
        if (typeof window !== 'undefined' && window.location.hostname.includes('staticblitz.com')) {
          console.warn('Running in StackBlitz environment - WebContainer might have preload issues');
        }

        // If we already have a global instance, use it
        if (globalWebContainer) {
          console.log('Using existing WebContainer instance');
          if (isMounted) {
            setWebcontainer(globalWebContainer);
            setLoading(false);
          }
          return;
        }

        // If there's already a boot in progress, wait for it
        if (bootPromise) {
          console.log('WebContainer boot already in progress, waiting...');
          const instance = await bootPromise;
          if (isMounted) {
            setWebcontainer(instance);
            setLoading(false);
          }
          return;
        }

        // Create new boot promise
        console.log('Starting new WebContainer boot...');
        bootPromise = WebContainer.boot();
        const webcontainerInstance = await bootPromise;
        
        // Store globally and in state
        globalWebContainer = webcontainerInstance;
        if (isMounted) {
          setWebcontainer(webcontainerInstance);
          setLoading(false);
        }
        console.log('WebContainer boot completed successfully');
        
        // Clear the promise
        bootPromise = null;
      } catch (err) {
        console.error('Failed to boot WebContainer:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
        
        // Clear the promise on error
        bootPromise = null;
      }
    }

    bootWebContainer();

    // Cleanup function - don't reset the global instance
    return () => {
      isMounted = false;
      // Only reset local state, keep global instance
      setWebcontainer(undefined);
      setError(null);
    };
  }, []);

  return { webcontainer, error, loading };
}