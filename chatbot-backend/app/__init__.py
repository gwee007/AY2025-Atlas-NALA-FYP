from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.core.model_loader import model_resources
from app.core.service_manager import service_manager
import logging

logger = logging.getLogger(__name__)

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)

    # Preload models during app startup with error handling
    try:
        print("[Flask Startup] Loading embedding and reranker models...")
        model_resources.load_models()
        print("[Flask Startup] Models loaded successfully.")
    except Exception as e:
        print(f"[Flask Startup] Failed to load models: {e}")
        print(f"[Flask Startup] WARNING: Continuing without models for testing...")
        logger.warning(f"Models not loaded: {e}")
    
    # Initialize shared services
    try:
        print("[Flask Startup] Initializing shared services...")
        service_manager.initialize()
        print("[Flask Startup] Shared services initialized successfully.")
    except Exception as e:
        print(f"[Flask Startup] Failed to initialize services: {e}")
        logger.error(f"Service initialization failed: {e}")
        raise

    # Import and register blueprints
    try:
        print("[Flask Startup] Registering routes...")
        from app.routes import main_bp
        from dashboard_backend.api_server import dashboard_bp
        
        app.register_blueprint(main_bp)
        app.register_blueprint(dashboard_bp)
        print(f"[Flask Startup] Routes registered successfully")
        
        # Debug: Print all registered routes
        print("[Flask Startup] Available routes:")
        for rule in app.url_map.iter_rules():
            print(f"  {rule.methods} {rule.rule}")
    except Exception as e:
        print(f"[Flask Startup] ERROR: Failed to register routes: {e}")
        import traceback
        traceback.print_exc()
        raise

    return app