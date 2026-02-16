// Frontend/src/components/DataVisualizer.jsx
// Component for uploading, parsing, and visualizing 2-column text data using Plotly.
// Key Internal Depends On: Frontend/src/lib/logger.js
// Key Internal Exported To: Frontend/src/App.jsx

import React, { useState } from 'react';
import Plotly from 'plotly.js/dist/plotly';
import createPlotlyComponent from 'react-plotly.js/factory';
import { Upload, FileText, Trash2, BarChart2 } from 'lucide-react';
import logger from '../lib/logger';

const Plot = createPlotlyComponent(Plotly);

export default function DataVisualizer() {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    logger.info('File selected for upload', { name: file.name, size: file.size });

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      try {
        const { x, y } = parseData(content);
        if (x.length === 0) {
          logger.warn('Parsed file contained no valid data', { name: file.name });
          alert('No valid two-column data found.');
          return;
        }

        const newFile = {
          id: Date.now().toString(),
          name: file.name,
          data: { x, y }
        };

        setFiles(prev => [...prev, newFile]);
        setSelectedFileId(newFile.id);
        logger.info('File parsed and added', { id: newFile.id, points: x.length });
      } catch (err) {
        logger.error('Error parsing file', { error: err.message });
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const parseData = (text) => {
    const lines = text.split('\n');
    const x = [];
    const y = [];

    lines.forEach(line => {
      // Match numbers separated by whitespace or comma
      const parts = line.trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        const valX = parseFloat(parts[0]);
        const valY = parseFloat(parts[1]);
        if (!isNaN(valX) && !isNaN(valY)) {
          x.push(valX);
          y.push(valY);
        }
      }
    });
    return { x, y };
  };

  const removeFile = (id, e) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
    logger.info('File removed', { id });
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      marginTop: '2rem',
      borderTop: '1px solid #444',
      paddingTop: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <BarChart2 style={{ marginRight: '0.5rem' }} /> Data Visualization
        </h2>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#2563eb',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 'bold'
        }}>
          <Upload size={16} />
          Load Data File
          <input type="file" accept=".txt,.csv,.dat" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: '500px' }}>
        {/* Sidebar List */}
        <div style={{
          width: '250px',
          background: '#1a1a1a',
          borderRadius: '8px',
          padding: '1rem',
          overflowY: 'auto',
          border: '1px solid #333'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', color: '#888' }}>Loaded Files</h4>
          {files.length === 0 && <p style={{ color: '#555', fontSize: '0.9rem' }}>No files loaded.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {files.map(file => (
              <li
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  background: selectedFileId === file.id ? '#2563eb' : '#333',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <FileText size={14} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem' }}>
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={(e) => removeFile(file.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    opacity: 0.7
                  }}
                  title="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Plot Area */}
        <div style={{
          flex: 1,
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {selectedFile ? (
            <Plot
              data={[
                {
                  x: selectedFile.data.x,
                  y: selectedFile.data.y,
                  type: 'scatter',
                  mode: 'lines+markers',
                  marker: { color: '#60a5fa' },
                  line: { color: '#2563eb' }
                }
              ]}
              layout={{
                autosize: true,
                title: selectedFile.name,
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#ccc' },
                xaxis: { gridcolor: '#333', title: 'Column 1' },
                yaxis: { gridcolor: '#333', title: 'Column 2' },
                margin: { t: 50, r: 30, l: 50, b: 50 }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ color: '#555', textAlign: 'center' }}>
              <BarChart2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Select a file to view plot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
