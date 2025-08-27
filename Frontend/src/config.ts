// Use environment variable or fallback to localhost for development
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const IS_PRODUCTION = import.meta.env.PROD;

// Optional Gemini API key (exposed via Vite at build time)
// Set `VITE_GEMINI_API_KEY` in your Vercel project settings for production builds
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;