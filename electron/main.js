// electron/main.js
// Main process entry point for Electron. Handles window creation, backend process management, and IPC logging.
// Key Internal Depends On: (none)
// Key Internal Exported To: (none)

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const log = require('electron-log');
const fs = require('fs');
const net = require('net');

// Configure isDev to be true if NODE_ENV is development OR if the app is not packaged (running from source)
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configure Logging
// In Dev: Write to <projectRoot>/logs
// In Prod: Write to <userData>/logs
const logDir = isDev 
  ? path.join(__dirname, '..', 'logs') 
  : path.join(app.getPath('userData'), 'logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure electron-log to use the determined directory
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(logDir, 'frontend.log');

// Separate error logger for frontend errors
const errorLog = log.create('frontend-error');
errorLog.transports.file.resolvePathFn = () => path.join(logDir, 'frontend-error.log');

let mainWindow;
let pythonProcess;
let apiPort = 5001; // Default port, will be updated if busy

function getPythonPath() {
  const projectRoot = path.resolve(__dirname, '..');
  // In dev, use the venv created by uv in Backend/API/.venv
  if (isDev) {
    const venvDir = path.join(projectRoot, 'Backend', 'API', '.venv');
    // Handle Windows vs Unix venv structure
    const binPath = process.platform === 'win32' 
      ? path.join(venvDir, 'Scripts', 'python.exe')
      : path.join(venvDir, 'bin', 'python');
      
    return fs.existsSync(binPath) ? binPath : 'python3';
  }
  // For prod, assume python is available or bundled.
  return 'python3';
}

function findOpenPort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref(); // Do not keep the process alive just for this check
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is busy, try the next one
        resolve(findOpenPort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

async function startBackend() {
  const pythonExecutable = getPythonPath();
  const apiDir = isDev 
    ? path.join(__dirname, '..', 'Backend', 'API') 
    : path.join(process.resourcesPath, 'api');

  // Find an available port dynamically
  try {
    apiPort = await findOpenPort(5001);
    console.log(`Found available port for backend: ${apiPort}`);
  } catch (err) {
    console.error('Failed to find an open port:', err);
    return;
  }

  // Add --reload flag in development to enable hot reloading for the backend
  // Added --reload-delay 2.0 to prevent aggressive reloading when files are being written (e.g. by AI)
  const args = isDev 
    ? ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', apiPort.toString(), '--reload', '--reload-delay', '2.0']
    : ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', apiPort.toString()];

  // Pass LOG_DIR to backend so it logs to the same folder as Electron
  const env = { 
    ...process.env,
    LOG_DIR: logDir
  };

  console.log(`Starting Python backend: ${pythonExecutable} ${args.join(' ')} in ${apiDir}`);

  pythonProcess = spawn(pythonExecutable, args, {
    cwd: apiDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'] // Pipe stdio to log it
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Backend]: ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error]: ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'Frontend', 'dist', 'index.html'));
  }
}

// Ensure backend is killed on exit
const killBackend = () => {
  if (pythonProcess) {
    console.log('Killing Python backend...');
    pythonProcess.kill();
    pythonProcess = null;
  }
};

// IPC Handler to provide API config to Renderer
ipcMain.handle('get-api-config', () => {
  return { port: apiPort };
});

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  killBackend();
});

// Handle signals for nodemon restarts (SIGUSR2 is default for nodemon)
const handleExit = () => {
  killBackend();
  app.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('SIGUSR2', handleExit);

// IPC for Logging
ipcMain.on('log', (event, { level, message, meta }) => {
  const logMsg = `${message} ${meta ? JSON.stringify(meta) : ''}`;
  if (level === 'error') {
    errorLog.error(logMsg);
  } else if (level === 'warn') {
    log.warn(logMsg);
  } else if (level === 'info') {
    log.info(logMsg);
  } else {
    log.debug(logMsg);
  }
});
