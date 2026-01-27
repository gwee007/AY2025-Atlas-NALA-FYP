-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a sample table with vector support (optional - modify as needed)
-- CREATE TABLE embeddings (
--     id SERIAL PRIMARY KEY,
--     content TEXT,
--     embedding vector(1536)
-- );
