-- Step 2: Create Indexes and Triggers

-- Create HNSW index for document_chunks embeddings
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create indexes for foreign keys to improve query performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_questions_message_id ON questions(message_id);
CREATE INDEX IF NOT EXISTS idx_answers_message_id ON answers(message_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_subtopic_id ON document_chunks(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_topic_dependencies_topic_id ON topic_dependencies(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_dependencies_related_topic_id ON topic_dependencies(related_topic_id);

-- Create trigger to automatically update last_accessed in conversations
CREATE OR REPLACE FUNCTION update_conversation_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_accessed = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_accessed ON messages;
CREATE TRIGGER trigger_update_conversation_last_accessed
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_accessed();

-- Create trigger to automatically update updated_at in questions
CREATE OR REPLACE FUNCTION update_questions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_questions_timestamp ON questions;
CREATE TRIGGER trigger_update_questions_timestamp
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_questions_timestamp();

-- Create trigger to automatically update updated_at in document_chunks
CREATE OR REPLACE FUNCTION update_document_chunks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_document_chunks_timestamp ON document_chunks;
CREATE TRIGGER trigger_update_document_chunks_timestamp
BEFORE UPDATE ON document_chunks
FOR EACH ROW
EXECUTE FUNCTION update_document_chunks_timestamp();
