from sqlalchemy import Column, BigInteger, Table, Text, TIMESTAMP, ForeignKey, func, Index, Integer, String
from sqlalchemy.orm import declarative_base, relationship
from pgvector.sqlalchemy import Vector

Base = declarative_base()

# association tables for questions with multiple topics and subtopics
question_topics = Table(
    'question_topics', Base.metadata,
    Column('question_id', BigInteger, ForeignKey('questions.id'), primary_key=True),
    Column('topic_id', BigInteger, ForeignKey('topics.id'), primary_key=True)
)

question_subtopics = Table(
    'question_subtopics', Base.metadata,
    Column('question_id', BigInteger, ForeignKey('questions.id'), primary_key=True),
    Column('subtopic_id', BigInteger, ForeignKey('subtopics.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, nullable=False)
    conversations = relationship("Conversation", back_populates="user") # one user can have many conversations

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(Text, nullable=False)
    last_accessed = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user = relationship("User", back_populates="conversations") # many conversations belong to one user
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan") # one conversation can have many messages

class Message(Base):
    __tablename__ = "messages"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    conversation_id = Column(BigInteger, ForeignKey("conversations.id"), nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    sender = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    conversation = relationship("Conversation", back_populates="messages") # many messages belong to one conversation
    question = relationship("Question", back_populates="message", uselist=False, cascade="all, delete-orphan") # one message has one question
    answer = relationship("Answer", back_populates="message", uselist=False, cascade="all, delete-orphan") # one message has one answer

class Question(Base):
    __tablename__ = "questions"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    message_id = Column(BigInteger, ForeignKey("messages.id"), nullable=False)

    solo_taxonomy_level = Column(String, nullable=False)
    grade = Column(String, nullable=False)
    reasoning = Column(Text, nullable=False)
    status = Column(String, default="AWAITING_ANSWER", nullable=False)  # values will be: AWAITING_ANSWER, ANSWERED
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    message = relationship("Message", back_populates="question") # one question belongs to one message
    answer = relationship("Answer", back_populates="question", uselist=False) # one question has one answer
    topics = relationship("Topic", secondary=question_topics, back_populates="questions")
    subtopics = relationship("Subtopic", secondary=question_subtopics, back_populates="questions")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    message_id = Column(BigInteger, ForeignKey("messages.id"), nullable=False)
    question_id = Column(BigInteger, ForeignKey("questions.id"), nullable=False)
    accuracy_score = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    message = relationship("Message", back_populates="answer") # one answer belongs to one message
    question = relationship("Question", back_populates="answer") # one answer belongs to one question

class Topic(Base):
    __tablename__ = "topics"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    topic_name = Column(Text, unique=True, nullable=False)
    questions = relationship("Question", secondary=question_topics, back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic")

class TopicDependency(Base):
    __tablename__ = "topic_dependencies"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    topic_id = Column(BigInteger, ForeignKey("topics.id"), nullable=False)
    related_topic_id = Column(BigInteger, ForeignKey("topics.id"), nullable=False)
    relation_type = Column(Text, default="related", nullable=False)

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    topic_id = Column(BigInteger, ForeignKey("topics.id"), nullable=False)
    subtopic_name = Column(Text, nullable=False)
    subtopic_summary = Column(Text, nullable=False)
    subtopic_summary_embedding = Column(Vector(1024), nullable=False) # no index needed since there are only 29 subtopics in total
    topic = relationship("Topic", back_populates="subtopics")
    questions = relationship("Question", secondary=question_subtopics, back_populates="subtopics")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(BigInteger, primary_key=True, autoincrement=True, nullable=False)
    subtopic_id = Column(BigInteger, ForeignKey("subtopics.id"), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1024), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    subtopic = relationship("Subtopic")

    __table_args__ = (
        Index(
            'document_chunks_embedding_idx',
            'embedding',
            postgresql_using='hnsw', # hnsw index for searching document chunks
            postgresql_ops={'embedding': 'vector_cosine_ops'}
        ),
    )