-- Step 1: Create Tables
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sender VARCHAR NOT NULL,
    content TEXT NOT NULL
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
    id BIGSERIAL PRIMARY KEY,
    topic_name TEXT UNIQUE NOT NULL
);

-- Create topic_dependencies table
CREATE TABLE IF NOT EXISTS topic_dependencies (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES topics(id),
    related_topic_id BIGINT NOT NULL REFERENCES topics(id),
    relation_type TEXT NOT NULL DEFAULT 'related'
);

-- Create subtopics table
CREATE TABLE IF NOT EXISTS subtopics (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES topics(id),
    subtopic_name TEXT NOT NULL,
    subtopic_summary TEXT NOT NULL,
    subtopic_summary_embedding vector(1024) NOT NULL
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id),
    solo_taxonomy_level VARCHAR NOT NULL,
    grade VARCHAR NOT NULL,
    reasoning TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'AWAITING_ANSWER',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    accuracy_score INTEGER NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create question_topics association table
CREATE TABLE IF NOT EXISTS question_topics (
    question_id BIGINT NOT NULL REFERENCES questions(id),
    topic_id BIGINT NOT NULL REFERENCES topics(id),
    PRIMARY KEY (question_id, topic_id)
);

-- Create question_subtopics association table
CREATE TABLE IF NOT EXISTS question_subtopics (
    question_id BIGINT NOT NULL REFERENCES questions(id),
    subtopic_id BIGINT NOT NULL REFERENCES subtopics(id),
    PRIMARY KEY (question_id, subtopic_id)
);

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    subtopic_id BIGINT NOT NULL REFERENCES subtopics(id),
    content TEXT NOT NULL,
    embedding vector(1024) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
