// Frontend/src/components/DataVisualizer.jsx
// Component for uploading, parsing, and visualizing 2-column text data using Plotly.
// Key Internal Depends On: Frontend/src/lib/logger.js
// Key Internal Exported To: Frontend/src/App.jsx
// (default welcome component, feel free to delete or completely edit)

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
    <div className="signal-workbench">
      {/* (default welcome component, feel free to delete or completely edit) */}
      <div className="signal-workbench__toolbar">
        <h3 className="signal-workbench__title">
          <BarChart2 size={20} />
          Flow visualizer
        </h3>
        <label className="signal-workbench__upload">
          <Upload size={16} />
          Load a signal file
          <input
            type="file"
            accept=".txt,.csv,.dat"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="signal-workbench__content">
        {/* (default welcome component, feel free to delete or completely edit) */}
        <div className="signal-workbench__sidebar">
          <h4 className="signal-workbench__sidebar-title">Loaded files</h4>
          {files.length === 0 && (
            <p className="signal-workbench__sidebar-empty">No files loaded yet.</p>
          )}
          <ul className="signal-workbench__file-list">
            {files.map(file => (
              <li
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`signal-workbench__file ${selectedFileId === file.id ? 'signal-workbench__file--active' : ''}`}
              >
                <div className="signal-workbench__file-main">
                  <FileText size={14} />
                  <span className="signal-workbench__file-name">{file.name}</span>
                </div>
                <button
                  onClick={(e) => removeFile(file.id, e)}
                  className="signal-workbench__file-remove"
                  title="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* (default welcome component, feel free to delete or completely edit) */}
        <div className="signal-workbench__plot-shell">
          {selectedFile ? (
            <Plot
              data={[
                {
                  x: selectedFile.data.x,
                  y: selectedFile.data.y,
                  type: 'scatter',
                  mode: 'lines+markers',
                  marker: { color: '#8ff7ff', size: 8 },
                  line: { color: '#53b9ff', width: 3 }
                }
              ]}
              layout={{
                autosize: true,
                title: selectedFile.name,
                  paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(10,24,48,0.2)',
                font: { color: '#ddffff' },
                xaxis: { gridcolor: 'rgba(118, 204, 216, 0.18)', title: 'Column 1' },
                yaxis: { gridcolor: 'rgba(118, 204, 216, 0.18)', title: 'Column 2' },
                margin: { t: 50, r: 30, l: 50, b: 50 }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="signal-workbench__empty">
              <BarChart2 size={48} />
              <p>Select a file to watch its data drift into view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
