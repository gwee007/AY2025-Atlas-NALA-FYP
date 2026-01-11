
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, ARRAY, Enum, BigInteger, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
import enum

Base = declarative_base()


class Chatbot(Base):
    """
    ROOT_OBJECT - Represents the chatbot system
    Contains: chatbot_id, users_count, and list of users
    """
    __tablename__ = 'chatbot'
    
    chatbot_id = Column(Integer, primary_key=True, autoincrement=True)
    users_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    users = relationship('User', back_populates='chatbot', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'chatbot_id': self.chatbot_id,
            'users_count': self.users_count,
            'users': [user.to_dict() for user in self.users]
        }


class User(Base):
    """
    USER - Represents a user in the system
    Contains: user_id, conversations_count, and list of conversations
    """
    __tablename__ = 'user'
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    chatbot_id = Column(Integer, ForeignKey('chatbot.chatbot_id'), nullable=False)
    conversations_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    chatbot = relationship('Chatbot', back_populates='users')
    conversations = relationship('Conversation', back_populates='user', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'conversations_count': self.conversations_count,
            'conversations': [conv.to_dict() for conv in self.conversations]
        }


class Conversation(Base):
    """
    CONVERSATION - Represents a chat session
    Contains: id, title, created_at, updated_at, and messages array
    """
    __tablename__ = 'conversation'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    title = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship('User', back_populates='conversations')
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'messages': [msg.to_dict() for msg in self.messages] if self.messages else []
        }


class Message(Base):
    """
    MESSAGE - Represents individual messages in a conversation
    Currently nullable/optional in the sample data
    """
    __tablename__ = 'message'
    
    message_id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('conversation.id'), nullable=False)
    sender = Column(String(50), nullable=False)  # 'user' or 'bot'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    message_metadata = Column(JSON, nullable=True)  # For any additional message data
    
    # Relationships
    conversation = relationship('Conversation', back_populates='messages')
    questions = relationship('Question', back_populates='message', cascade='all, delete-orphan')
    answers = relationship('Answer', back_populates='message', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'message_id': self.message_id,
            'sender': self.sender,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'message_metadata': self.message_metadata
        }

    
class Question(Base):
    """
    QUESTION - Represents a question asked by the user
    Links to a message and optionally a topic
    """
    __tablename__ = 'question'
    
    question_id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, nullable=True)  # FK to topic (nullable for now)
    message_id = Column(Integer, ForeignKey('message.message_id'), nullable=False)
    grade = Column(String(10), nullable=True)
    feedback = Column(Text, nullable=True)
    solo_taxonomy_label = Column(String(50), nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    
    # Relationships
    message = relationship('Message', back_populates='questions')
    answer = relationship('Answer', back_populates='question', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'question_id': self.question_id,
            'topic_id': self.topic_id,
            'message_id': self.message_id,
            'grade': self.grade,
            'feedback': self.feedback,
            'solo_taxonomy_label': self.solo_taxonomy_label,
            'duration': self.duration,
            'answer': self.answer.to_dict() if self.answer else None
        }


class Answer(Base):
    """
    ANSWER - Represents an answer given by the bot
    One-to-one relationship with Question (zero or one answer per question)
    """
    __tablename__ = 'answer'
    
    answer_id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey('question.question_id'), nullable=False, unique=True)  # One-to-one
    message_id = Column(Integer, ForeignKey('message.message_id'), nullable=False)
    topic_id = Column(Integer, nullable=True)  # FK to topic (nullable for now)
    accuracy = Column(Integer, nullable=True)  # Accuracy score (0-100)
    feedback = Column(Text, nullable= True)  
    
    # Relationships
    question = relationship('Question', back_populates='answer')
    message = relationship('Message', back_populates='answers')
    
    def to_dict(self):
        return {
            'answer_id': self.answer_id,
            'question_id': self.question_id,
            'message_id': self.message_id,
            'topic_id': self.topic_id,
            'accuracy': self.accuracy,
            'feedback': self.feedback
        }

class Topic(Base):
    __tablename__ = "topics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_name = Column(Text, unique=True, nullable=False)
    topic_summary = Column(Text, nullable=False)
   #  topic_summary_embedding = Column(Vector(1024))  # Temporarily disabled - requires pgvector extension

class TopicDependency(Base): 
    __tablename__ = "topic_dependencies"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column(BigInteger, ForeignKey("topics.id"))
    related_topic_id = Column(BigInteger, ForeignKey("topics.id"))
    relation_type = Column(Text, default="related")

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column(BigInteger, ForeignKey("topics.id"), nullable=False)
    subtopic_name = Column(Text, nullable=False)
    subtopic_summary = Column(Text, nullable=False)
    #subtopic_summary_embedding = Column(Vector(1024))  # Temporarily disabled - requires pgvector extension

# class SubtopicDependency(Base):
#     __tablename__ = "subtopic_dependencies"
#     id = Column(BigInteger, primary_key=True, autoincrement=True)
#     subtopic_id = Column(BigInteger, ForeignKey("subtopics.id"))
#     related_subtopic_id = Column(BigInteger, ForeignKey("subtopics.id"))
#     relation_type = Column(Text, default="related")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    subtopic_id = Column(BigInteger, ForeignKey("subtopics.id"))  # References subtopics
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1024))  # Temporarily disabled - requires pgvector extension
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
