"""
Service Manager - Singleton pattern for shared service instances.
Prevents duplicate instantiation of expensive services like LLM client and RAG service.
"""
from typing import Optional
from app.core.llm_client import NalaGemini
from app.core.model_loader import model_resources
import logging

logger = logging.getLogger(__name__)


class ServiceManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ServiceManager, cls).__new__(cls)
            cls._instance._llm_client = None
            cls._instance._initialized = False
        return cls._instance
    
    def initialize(self):
        """Initialize all shared services."""
        if self._initialized:
            logger.info("[ServiceManager] Services already initialized.")
            return
        
        try:
            logger.info("[ServiceManager] Initializing shared services...")
            
            # Initialize LLM client (singleton - uses persistent session)
            self._llm_client = NalaGemini()
            
            # Verify models are loaded
            if not model_resources.is_loaded():
                logger.warning("[ServiceManager] Models not loaded, attempting to load...")
                model_resources.load_models()
            
            self._initialized = True
            logger.info("[ServiceManager] All shared services initialized successfully.")
        
        except Exception as e:
            logger.error(f"[ServiceManager] Failed to initialize services: {e}")
            raise
    
    def get_llm_client(self) -> NalaGemini:
        """Get the shared LLM client instance."""
        if not self._initialized or not self._llm_client:
            raise RuntimeError("ServiceManager not initialized. Call initialize() first.")
        return self._llm_client
    
    def is_initialized(self) -> bool:
        """Check if service manager is initialized."""
        return self._initialized


# Global service manager instance
service_manager = ServiceManager()
