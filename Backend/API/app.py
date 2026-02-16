# Backend/API/app.py
# Purpose: FastAPI application entry point handling API routes and frontend logging.
# Key Internal Depends On: logger_config.py
# Key Internal Exported To: electron/main.js (via uvicorn)

import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from logger_config import setup_logging

# Setup Logging
log_dir = setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS: Allow all in dev, restrict in prod if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LogPayload(BaseModel):
    level: str
    message: str
    timestamp: str
    meta: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/ping")
def ping():
    logger.info("Ping request received")
    return {"message": "pong", "backend_pid": os.getpid()}

@app.post("/api/client-logs")
def client_logs(payload: LogPayload):
    """
    Endpoint for Web Frontend to send logs to the backend.
    These are written to frontend.log in the server's log directory.
    """
    # We manually write to the frontend log file to keep separation
    frontend_log_path = os.path.join(log_dir, "frontend.log")
    frontend_error_path = os.path.join(log_dir, "frontend-error.log")
    
    # Format the log entry
    meta_str = str(payload.meta) if payload.meta else "{}"
    log_entry = f"{payload.timestamp} - FRONTEND - {payload.level.upper()} - {payload.message} - {meta_str}\n"
    
    try:
        target_file = frontend_error_path if payload.level.lower() == 'error' else frontend_log_path
        # Use utf-8 to ensure special characters in logs don't crash the write
        with open(target_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        logger.error(f"Failed to write frontend log: {e}", exc_info=True)
        return {"status": "error", "message": "Failed to write log"}

    return {"status": "ok"}
