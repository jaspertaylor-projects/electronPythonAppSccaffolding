// Frontend/src/App.jsx
// Main React Application Component.
// Key Internal Depends On: Frontend/src/lib/logger.js, Frontend/src/lib/api.js, Frontend/src/components/DataVisualizer.jsx
// Key Internal Exported To: Frontend/src/main.jsx

import React, { useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import logger from './lib/logger';
import { getApiBaseUrl } from './lib/api';
import DataVisualizer from './components/DataVisualizer';

export default function App() {
  const [status, setStatus] = useState('Idle');
  const [pingResult, setPingResult] = useState(null);

  const handlePing = async () => {
    setStatus('Pinging...');
    logger.info('Initiating ping request', { route: '/api/ping' });
    try {
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/ping`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPingResult(data);
      setStatus('Success');
      logger.info('Ping success', { data });
    } catch (error) {
      setStatus('Error');
      logger.error('Ping failed', { error: error.message });
    }
  };

  const handleTestError = () => {
    // Intentionally throw an error to test global capture
    throw new Error('This is a test error triggered by the user.');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#eee', background: '#000', minHeight: '100vh' }}>
      <h1>Electron + React + FastAPI</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={handlePing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          <Activity size={16} /> Ping Backend
        </button>
        <button onClick={handleTestError} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          <AlertCircle size={16} /> Trigger Error
        </button>
      </div>

      <div style={{ border: '1px solid #444', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>Status: {status}</h3>
        {pingResult && (
          <pre style={{ background: '#111', padding: '1rem', borderRadius: '4px' }}>
            {JSON.stringify(pingResult, null, 2)}
          </pre>
        )}
      </div>

      <DataVisualizer />
    </div>
  );
}
