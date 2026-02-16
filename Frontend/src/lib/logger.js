// Frontend/src/lib/logger.js

/**
 * Redacts sensitive keys from objects before logging.
 */
function redact(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];
  const copy = { ...meta };
  for (const key in copy) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      copy[key] = '[REDACTED]';
    }
  }
  return copy;
}

const logger = {
  info: (message, meta = {}) => log('info', message, meta),
  warn: (message, meta = {}) => log('warn', message, meta),
  error: (message, meta = {}) => log('error', message, meta),
  debug: (message, meta = {}) => log('debug', message, meta),
};

async function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const safeMeta = redact(meta);
  const payload = { timestamp, level, message, meta: safeMeta };

  // Desktop: Send to Electron Main
  if (window.electronAPI) {
    window.electronAPI.log(level, message, safeMeta);
    return;
  }

  // Web: Send to Backend API
  try {
    await fetch('/api/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to send log to backend:', err);
  }
}

// Global Error Handlers
window.addEventListener('error', (event) => {
  logger.error('Unhandled Window Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason ? event.reason.toString() : 'Unknown',
  });
});

export default logger;
