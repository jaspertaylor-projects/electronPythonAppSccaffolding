# Backend/API/logger_config.py
import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Determine log directory: Env var (from Electron) or default to root logs folder
    # Default fallback: ../../logs (relative to Backend/API/)
    default_log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "logs"))
    log_dir = os.environ.get("LOG_DIR", default_log_dir)
    
    os.makedirs(log_dir, exist_ok=True)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # 1. Backend General Log
    backend_log_file = os.path.join(log_dir, "backend.log")
    file_handler = RotatingFileHandler(backend_log_file, maxBytes=5*1024*1024, backupCount=3)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # 2. Backend Error Log
    backend_error_file = os.path.join(log_dir, "backend-error.log")
    error_handler = RotatingFileHandler(backend_error_file, maxBytes=5*1024*1024, backupCount=3)
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    # Root Logger Configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    # Console Handler (for dev visibility)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    return log_dir
