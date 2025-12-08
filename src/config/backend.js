// Backend API configuration
// Uses environment variable VITE_BACKEND_URL
// In development: http://localhost:5000
// In production: set via .env.production file

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default BACKEND_URL;

