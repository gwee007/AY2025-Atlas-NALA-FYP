import warnings
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
from FlagEmbedding import FlagReranker
warnings.filterwarnings("ignore", message=".*XLMRobertaTokenizerFast.*__call__.*")


# using singleton pattern to load models only once
class ModelResources:
    _instance = None
    
    # Model identifiers - use local paths in Docker, HF model IDs locally
    EMBEDDING_MODEL_LOCAL = '/models/bge-m3'
    EMBEDDING_MODEL_HF = 'BAAI/bge-m3'
    RERANKER_MODEL_LOCAL = '/models/bge-reranker-v2-m3'
    RERANKER_MODEL_HF = 'BAAI/bge-reranker-v2-m3'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelResources, cls).__new__(cls)
            cls._instance.embedding_model = None
            cls._instance.reranker_model = None
            cls._instance._models_loaded = False
        return cls._instance
    
    def _get_model_path(self, local_path, hf_model_id):
        """
        Determine which model path to use:
        - If local path exists (Docker): use it
        - Otherwise (local dev): use Hugging Face model ID (will auto-download)
        """
        # Check if running in Docker (local models available)
        if Path(local_path).exists():
            print(f"[ModelResources] Using local model path: {local_path}")
            return local_path
        else:
            print(f"[ModelResources] Local path not found, using Hugging Face: {hf_model_id}")
            return hf_model_id
    
    def load_models(self):
        if self._models_loaded and self.embedding_model and self.reranker_model:
            print("[ModelResources] Models are already loaded.")
            return
        
        try:
            # Determine embedding model path
            embedding_path = self._get_model_path(
                self.EMBEDDING_MODEL_LOCAL, 
                self.EMBEDDING_MODEL_HF
            )
            print(f"[ModelResources] Loading BGE-M3 embedding model from {embedding_path}...")
            self.embedding_model = SentenceTransformer(embedding_path)
            
            # Determine reranker model path
            reranker_path = self._get_model_path(
                self.RERANKER_MODEL_LOCAL,
                self.RERANKER_MODEL_HF
            )
            print(f"[ModelResources] Loading BGE Reranker model from {reranker_path}...")
            self.reranker_model = FlagReranker(reranker_path, use_fp16=True)
            
            self._models_loaded = True
            print("[ModelResources] All models loaded successfully.")
        except Exception as e:
            print(f"[ModelResources] Failed to load models: {e}")
            raise e
        
    def get_embedding_model(self):
        if not self.embedding_model or not self._models_loaded:
            raise RuntimeError("Embedding model is not loaded. Models should be loaded during app startup.")
        return self.embedding_model
    
    def get_reranker_model(self):
        if not self.reranker_model or not self._models_loaded:
            raise RuntimeError("Reranker model is not loaded. Models should be loaded during app startup.")
        return self.reranker_model
    
    def is_loaded(self):
        return self._models_loaded and self.embedding_model is not None and self.reranker_model is not None
    
    def get_readiness_status(self):
        """
        Return detailed readiness status for health checks.
        Returns dict with status, models_loaded, and any error messages.
        """
        return {
            "ready": self.is_loaded(),
            "embedding_model_loaded": self.embedding_model is not None,
            "reranker_model_loaded": self.reranker_model is not None,
            "models_initialized": self._models_loaded
        }

# create a global instance
model_resources = ModelResources()