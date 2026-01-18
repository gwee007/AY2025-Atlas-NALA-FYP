from sentence_transformers import SentenceTransformer
from FlagEmbedding import FlagReranker

# using singleton pattern to load models only once
class ModelResources:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelResources, cls).__new__(cls)
            cls._instance.embedding_model = None
            cls._instance.reranker_model = None
            cls._instance._models_loaded = False
        return cls._instance
    
    def load_models(self):
        if self._models_loaded and self.embedding_model and self.reranker_model:
            print("[ModelResources] Models are already loaded.")
            return
        
        try:
            print("[ModelResources] Loading BGE-M3 embedding model...")
            self.embedding_model = SentenceTransformer('BAAI/bge-m3')
            print("[ModelResources] Loading BGE Reranker model...")
            self.reranker_model = FlagReranker('BAAI/bge-reranker-v2-m3', use_fp16=True)
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

# create a global instance
model_resources = ModelResources()