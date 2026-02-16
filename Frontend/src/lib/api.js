// Frontend/src/lib/api.js
// Utility to determine the API base URL dynamically.
// Key Internal Depends On: electron/preload.js (via window.electronAPI)
// Key Internal Exported To: Frontend/src/App.jsx

let cachedBaseUrl = null;

/**
 * Returns the API base URL.
 * In Electron, it fetches the dynamic port from the main process.
 * In Web, it uses the environment variable or defaults to relative path.
 */
export const getApiBaseUrl = async () => {
  if (cachedBaseUrl) return cachedBaseUrl;

  // Check if running in Electron and if the API config is available
  if (window.electronAPI && window.electronAPI.getApiConfig) {
    try {
      const config = await window.electronAPI.getApiConfig();
      if (config && config.port) {
        // Use the dynamic port found by Electron
        cachedBaseUrl = `http://127.0.0.1:${config.port}`;
        return cachedBaseUrl;
      }
    } catch (err) {
      console.error('Failed to get API config from Electron:', err);
    }
  }

  // Fallback for Web / Dev without Electron (uses Vite proxy or env var)
  // If VITE_API_BASE_URL is set, use it. Otherwise empty string (relative path).
  cachedBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return cachedBaseUrl;
};
