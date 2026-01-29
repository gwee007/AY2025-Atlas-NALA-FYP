#!/bin/sh
# Script to download AI models using wget
# Models: BAAI/bge-m3 and BAAI/bge-reranker-v2-m3

set -e

echo "Starting model downloads..."

# Create directories
mkdir -p /models/bge-m3
mkdir -p /models/bge-reranker-v2-m3

# Download BGE-M3 model files
echo "Downloading BAAI/bge-m3 model..."
cd /models/bge-m3

wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/model.safetensors
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer_config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/tokenizer.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/special_tokens_map.json
wget -q --show-progress https://huggingface.co/BAAI/bge-m3/resolve/main/sentence_bert_config.json

# Download BGE-Reranker-v2-m3 model files
echo "Downloading BAAI/bge-reranker-v2-m3 model..."
cd /models/bge-reranker-v2-m3

wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/model.safetensors
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer_config.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/tokenizer.json
wget -q --show-progress https://huggingface.co/BAAI/bge-reranker-v2-m3/resolve/main/special_tokens_map.json

echo "All models downloaded successfully!"
echo "Models are available in /models volume"
