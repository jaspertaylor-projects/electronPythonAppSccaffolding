// Frontend/src/App.jsx
// Main React Application Component.
// Key Internal Depends On: Frontend/src/lib/logger.js, Frontend/src/lib/api.js, Frontend/src/components/DataVisualizer.jsx
// Key Internal Exported To: Frontend/src/main.jsx
// (default welcome component, feel free to delete or completely edit)

import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Droplets,
  Sparkles,
  Wand2
} from 'lucide-react';
import logger from './lib/logger';
import { getApiBaseUrl } from './lib/api';
import DataVisualizer from './components/DataVisualizer';

const starterCards = [
  {
    icon: Bot,
    eyebrow: 'Prompt Engine',
    title: 'Sketch new flows with the backend already wired in.',
    text: 'Use this starter surface to prototype agent loops, copilots, and local-first workflows.'
  },
  {
    icon: Sparkles,
    eyebrow: 'Vibe System',
    title: 'Tune the tone, visuals, and interactions like a living moodboard.',
    text: 'The shell is intentionally opinionated so you can swap in your own aesthetic fast.'
  },
  {
    icon: Activity,
    eyebrow: 'Live Bridge',
    title: 'Check the Electron to FastAPI path before you build bigger features.',
    text: 'Ping the backend, inspect the payload, and keep iterating with confidence.'
  }
];

export default function App() {
  const [status, setStatus] = useState('Idle');
  const [pingResult, setPingResult] = useState(null);
  const statusSlug = status.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />
      <div className="app-shell__bubble app-shell__bubble--one" />
      <div className="app-shell__bubble app-shell__bubble--two" />
      <div className="app-shell__bubble app-shell__bubble--three" />

      <main className="app-home">
        {/* (default welcome component, feel free to delete or completely edit) */}
        <section className="hero-panel">
          <div className="hero-panel__copy">
            <div className="hero-panel__eyebrow">
              <Droplets size={16} />
              Puraviba starter current
            </div>

            <h1 className="hero-panel__title">
              Build your next vibe-coded desktop flow in a sea of bubbles.
            </h1>

            <p className="hero-panel__text">
              This welcome screen is a soft-launch pad for Puraviba: a watery home base
              for experiments, copilots, prompts, and reactive desktop ideas.
            </p>

            <div className="hero-panel__actions">
              <button className="app-button app-button--primary" onClick={handlePing}>
                <Activity size={17} />
                Ping backend
              </button>
              <button className="app-button app-button--secondary" onClick={handleTestError}>
                <AlertCircle size={17} />
                Trigger test error
              </button>
            </div>

            <div className="hero-panel__metrics">
              <div className="metric-card">
                <span className="metric-card__label">Platform mood</span>
                <strong className="metric-card__value">Watery and alive</strong>
              </div>
              <div className="metric-card">
                <span className="metric-card__label">Starter focus</span>
                <strong className="metric-card__value">Prompt-to-product loops</strong>
              </div>
              <div className="metric-card">
                <span className="metric-card__label">Local stack</span>
                <strong className="metric-card__value">Electron + React + FastAPI</strong>
              </div>
            </div>
          </div>

          <div className="hero-panel__status">
            <div className="status-card">
              <div className="status-card__header">
                <span className="status-card__pill">Live starter check</span>
                <span className={`status-card__state status-card__state--${statusSlug}`}>
                  {status}
                </span>
              </div>

              <h2 className="status-card__title">Keep your first Puraviba current moving.</h2>

              <p className="status-card__text">
                Kick the backend, inspect the response, then replace this screen with the
                workflow you actually want to ship.
              </p>

              {pingResult ? (
                <pre className="status-card__payload">
                  {JSON.stringify(pingResult, null, 2)}
                </pre>
              ) : (
                <div className="status-card__empty">
                  <Wand2 size={20} />
                  <span>Your first ping result will ripple into view here.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* (default welcome component, feel free to delete or completely edit) */}
        <section className="starter-grid">
          {starterCards.map(({ icon: Icon, eyebrow, title, text }) => (
            <article key={title} className="starter-card">
              <div className="starter-card__icon">
                <Icon size={20} />
              </div>
              <p className="starter-card__eyebrow">{eyebrow}</p>
              <h3 className="starter-card__title">{title}</h3>
              <p className="starter-card__text">{text}</p>
              <div className="starter-card__link">
                Start shaping this area
                <ArrowRight size={16} />
              </div>
            </article>
          ))}
        </section>

        {/* (default welcome component, feel free to delete or completely edit) */}
        <section className="workbench-shell">
          <div className="workbench-shell__header">
            <div>
              <p className="section-kicker">Signal lagoon</p>
              <h2 className="section-title">Drop sample data into Puraviba’s bubbly workbench.</h2>
            </div>
            <p className="section-text">
              The visualizer below is still live, but it now sits inside the starter home so
              you can test interactions while the product identity takes shape.
            </p>
          </div>

          <DataVisualizer />
        </section>
      </main>
    </div>
  );
}
