#!/bin/sh
# Script to download AI models using wget with duplicate detection
# Models: BAAI/bge-m3 and BAAI/bge-reranker-v2-m3

set -e

echo "Starting model downloads with duplicate detection..."

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Function to check if BGE-M3 model is already downloaded
is_bge_m3_complete() {
    local model_dir="/models/bge-m3"
    
    # Check if all essential files exist
    [ -f "$model_dir/config.json" ] && \
    [ -f "$model_dir/config_sentence_transformers.json" ] && \
    [ -f "$model_dir/modules.json" ] && \
    [ -f "$model_dir/sentence_bert_config.json" ] && \
    [ -f "$model_dir/pytorch_model.bin" ] && \
    [ -f "$model_dir/tokenizer_config.json" ] && \
    [ -f "$model_dir/tokenizer.json" ] && \
    [ -f "$model_dir/special_tokens_map.json" ] && \
    [ -f "$model_dir/sentencepiece.bpe.model" ] && \
    [ -f "$model_dir/colbert_linear.pt" ] && \
    [ -f "$model_dir/sparse_linear.pt" ] && \
    [ -f "$model_dir/1_Pooling/config.json" ]
}

# Function to check if BGE-Reranker-v2-m3 model is already downloaded
is_bge_reranker_complete() {
    local model_dir="/models/bge-reranker-v2-m3"
    
    # Check if all essential files exist
    [ -f "$model_dir/config.json" ] && \
    [ -f "$model_dir/model.safetensors" ] && \
    [ -f "$model_dir/tokenizer_config.json" ] && \
    [ -f "$model_dir/tokenizer.json" ] && \
    [ -f "$model_dir/special_tokens_map.json" ] && \
    [ -f "$model_dir/sentencepiece.bpe.model" ]
}

# =============================================================================
# BGE-M3 EMBEDDING MODEL
# =============================================================================
if is_bge_m3_complete; then
    echo "✓ BGE-M3 model already exists and appears complete, skipping download"
else
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
fi

# =============================================================================
# BGE-RERANKER-V2-M3 MODEL
# =============================================================================
if is_bge_reranker_complete; then
    echo "✓ BGE-Reranker-v2-m3 model already exists and appears complete, skipping download"
else
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
fi

# =============================================================================
# VERIFICATION
# =============================================================================
echo ""
echo "==================================================================="
echo "Final Model Status"
echo "==================================================================="

if is_bge_m3_complete; then
    echo "✓ BGE-M3 model: COMPLETE"
else
    echo "✗ BGE-M3 model: INCOMPLETE"
fi

if is_bge_reranker_complete; then
    echo "✓ BGE-Reranker-v2-m3 model: COMPLETE"
else
    echo "✗ BGE-Reranker-v2-m3 model: INCOMPLETE"
fi

echo ""
echo "BGE-M3 files ($(ls -1 /models/bge-m3/ 2>/dev/null | wc -l) files):"
ls -lh /models/bge-m3/ 2>/dev/null | tail -n +2 || echo "Directory not found"

echo ""
echo "BGE-M3 Pooling config:"
ls -lh /models/bge-m3/1_Pooling/ 2>/dev/null || echo "Directory not found"

echo ""
echo "BGE-Reranker-v2-m3 files ($(ls -1 /models/bge-reranker-v2-m3/ 2>/dev/null | wc -l) files):"
ls -lh /models/bge-reranker-v2-m3/ 2>/dev/null | tail -n +2 || echo "Directory not found"

echo ""
echo "==================================================================="
if is_bge_m3_complete && is_bge_reranker_complete; then
    echo "✓ All models are ready and complete!"
    exit 0
else
    echo "✗ Some models are incomplete. Please check the download process."
    exit 1
fi
echo "==================================================================="