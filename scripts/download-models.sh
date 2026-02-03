# #!/bin/sh
# # Script to download AI models using wget
# # Models: BAAI/bge-m3 and BAAI/bge-reranker-v2-m3

# set -e

# echo "Starting model downloads..."

# # Create directories
# mkdir -p /models/bge-m3
# mkdir -p /models/bge-reranker-v2-m3

# # Download BGE-M3 model files
# echo "Downloading BAAI/bge-m3 model..."
# cd /models/bge-m3

# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/config.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/model.safetensors
# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer_config.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/special_tokens_map.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/sentence_bert_config.json

# # Download BGE-Reranker-v2-m3 model files
# echo "Downloading BAAI/bge-reranker-v2-m3 model..."
# cd /models/bge-reranker-v2-m3

# wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/config.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/model.safetensors
# wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer_config.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer.json
# wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/special_tokens_map.json

# echo "All models downloaded successfully!"
# echo "Models are available in /models volume"

#!/bin/sh
# Complete script to download BAAI models using wget
# Models: BAAI/bge-m3 and BAAI/bge-reranker-v2-m3

set -e

echo "Starting model downloads..."

# =============================================================================
# BGE-M3 EMBEDDING MODEL
# =============================================================================
echo "Downloading BAAI/bge-m3 model..."
mkdir -p /models/bge-m3/1_Pooling
cd /models/bge-m3

# Core configuration files (CRITICAL - SentenceTransformer needs these!)
echo "  → Downloading config files..."
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/config_sentence_transformers.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/modules.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/sentence_bert_config.json

# Model weights (2.27 GB)
echo "  → Downloading model weights (this will take a while)..."
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/pytorch_model.bin

# Tokenizer files
echo "  → Downloading tokenizer files..."
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer_config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/special_tokens_map.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/sentencepiece.bpe.model

# Additional model components for multi-vector and sparse retrieval
echo "  → Downloading additional components..."
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/colbert_linear.pt
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/sparse_linear.pt

# Pooling layer configuration (CRITICAL!)
echo "  → Downloading pooling configuration..."
cd 1_Pooling
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/1_Pooling/config.json
cd /models/bge-m3

echo "✓ BGE-M3 model downloaded successfully"

# =============================================================================
# BGE-RERANKER-V2-M3 MODEL
# =============================================================================
echo ""
echo "Downloading BAAI/bge-reranker-v2-m3 model..."
mkdir -p /models/bge-reranker-v2-m3
cd /models/bge-reranker-v2-m3

# Core configuration
echo "  → Downloading config files..."
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/config.json

# Model weights (2.27 GB - safetensors format)
echo "  → Downloading model weights (this will take a while)..."
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/model.safetensors

# Tokenizer files
echo "  → Downloading tokenizer files..."
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer_config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/special_tokens_map.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/sentencepiece.bpe.model

echo "✓ BGE-Reranker-v2-m3 model downloaded successfully"

# =============================================================================
# VERIFICATION
# =============================================================================
echo ""
echo "==================================================================="
echo "Model Download Summary"
echo "==================================================================="
echo ""
echo "BGE-M3 files ($(ls -1 /models/bge-m3/ | wc -l) files):"
ls -lh /models/bge-m3/ | tail -n +2
echo ""
echo "BGE-M3 Pooling config:"
ls -lh /models/bge-m3/1_Pooling/
echo ""
echo "BGE-Reranker-v2-m3 files ($(ls -1 /models/bge-reranker-v2-m3/ | wc -l) files):"
ls -lh /models/bge-reranker-v2-m3/ | tail -n +2
echo ""
echo "==================================================================="
echo "✓ All models downloaded successfully to /models volume!"
echo "==================================================================="