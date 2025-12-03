"""
SQLAlchemy models for NALA database schema. This is referencing an existing schema that may now be outdated so please discard this in your mind.
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, JSON,
    ForeignKey, DECIMAL, TIMESTAMP
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = 'user'
    
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    hashed_id = Column(String, nullable=False)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    group = Column(String, nullable=True)
    
    # Relationships
    activity_logs = relationship('ActivityLog', back_populates='user')
    conversations = relationship('Conversation', back_populates='created_by')
    consents = relationship('Consent', back_populates='user')
    chatbots = relationship('Chatbot', back_populates='created_by')


class ActivityLog(Base):
    __tablename__ = 'activity_log'
    
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    log_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    
    # Relationships
    user = relationship('User', back_populates='activity_logs')


class Course(Base):
    __tablename__ = 'course'
    
    course_id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    
    # Relationships
    chatbots = relationship('Chatbot', back_populates='course')


class Chatbot(Base):
    __tablename__ = 'chatbot'
    
    chatbot_id = Column(Integer, primary_key=True, autoincrement=True)
    created_by_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    course_id = Column(Integer, ForeignKey('course.course_id'), nullable=False)
    name = Column(String, nullable=False)
    url_path = Column(String, nullable=False)
    db_endpoint = Column(String, nullable=False)
    db_name = Column(String, nullable=False)
    control = Column(Integer, nullable=False)
    
    # Relationships
    created_by = relationship('User', back_populates='chatbots')
    course = relationship('Course', back_populates='chatbots')
    conversations = relationship('Conversation', back_populates='chatbot')
    consents = relationship('Consent', back_populates='chatbot')


class Conversation(Base):
    __tablename__ = 'conversation'
    
    conversation_id = Column(Integer, primary_key=True, autoincrement=True)
    created_by_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    chatbot_id = Column(Integer, ForeignKey('chatbot.chatbot_id'), nullable=False)
    title = Column(String, nullable=False)
    triggered_by = Column(String, nullable=False)
    last_accessed = Column(TIMESTAMP, nullable=False)
    
    # Relationships
    created_by = relationship('User', back_populates='conversations')
    chatbot = relationship('Chatbot', back_populates='conversations')
    messages = relationship('Message', back_populates='conversation')


class Message(Base):
    __tablename__ = 'message'
    
    message_id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey('conversation.conversation_id'), nullable=False)
    timestamp = Column(TIMESTAMP, nullable=False)
    sender = Column(String, nullable=False)
    text = Column(JSON, nullable=False)
    context = Column(JSON, nullable=False)
    user_evaluation = Column(Boolean, nullable=True)
    user_feedback = Column(String, nullable=True)
    
    # Relationships
    conversation = relationship('Conversation', back_populates='messages')
    questions = relationship('Question', back_populates='message')
    answers = relationship('Answer', back_populates='message')


class Topic(Base):
    __tablename__ = 'topic'
    
    topic_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    taxonomy = Column(JSON, nullable=False)
    
    # Relationships
    questions = relationship('Question', back_populates='topic')
    answers = relationship('Answer', back_populates='topic')


class Question(Base):
    __tablename__ = 'question'
    
    question_id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(Integer, ForeignKey('topic.topic_id'), nullable=False)
    message_id = Column(Integer, ForeignKey('message.message_id'), nullable=False)
    grade = Column(String, nullable=True)
    feedback = Column(String, nullable=True)
    solo_taxonomy_label = Column(String, nullable=True)
    
    # Relationships
    topic = relationship('Topic', back_populates='questions')
    message = relationship('Message', back_populates='questions')
    answers = relationship('Answer', back_populates='question')


class Answer(Base):
    __tablename__ = 'answer'
    
    answer_id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey('question.question_id'), nullable=False)
    message_id = Column(Integer, ForeignKey('message.message_id'), nullable=False)
    topic_id = Column(Integer, ForeignKey('topic.topic_id'), nullable=False)
    accuracy = Column(String, nullable=True)
    feedback = Column(String, nullable=True)
    bloom_taxonomy_label = Column(String, nullable=True)
    
    # Relationships
    question = relationship('Question', back_populates='answers')
    message = relationship('Message', back_populates='answers')
    topic = relationship('Topic', back_populates='answers')


class ConsentForm(Base):
    __tablename__ = 'consent_form'
    
    form_id = Column(Integer, primary_key=True, autoincrement=True)
    irb_number = Column(String, nullable=False)
    content = Column(JSON, nullable=False)
    
    # Relationships
    consents = relationship('Consent', back_populates='form')


class Consent(Base):
    __tablename__ = 'consent'
    
    consent_id = Column(Integer, primary_key=True, autoincrement=True)
    consent_form_id = Column(Integer, ForeignKey('consent_form.form_id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False)
    chatbot_id = Column(Integer, ForeignKey('chatbot.chatbot_id'), nullable=False)
    email = Column(String, nullable=False)
    consent_current_research = Column(Boolean, nullable=False)
    consent_future_research = Column(Integer, nullable=False)
    consent_contact = Column(Boolean, nullable=False)
    consent_usage = Column(Boolean, nullable=False)
    signed_date_current_research = Column(TIMESTAMP, nullable=False)
    
    # Relationships
    form = relationship('ConsentForm', back_populates='consents')
    user = relationship('User', back_populates='consents')
    chatbot = relationship('Chatbot', back_populates='consents')


class ProdConfig(Base):
    __tablename__ = 'prod_config'
    
    prod_config_id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    category = Column(String, nullable=False)


class SandboxConfig(Base):
    __tablename__ = 'sandbox_config'
    
    sandbox_config_id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    category = Column(String, nullable=False)


class InteractionData(Base):
    __tablename__ = 'interaction_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    InteractionType = Column(String, nullable=False)
    StartTime = Column(DateTime, nullable=False)
    EndTime = Column(DateTime, nullable=False)
    DurationSeconds = Column(Integer, nullable=False)
    InteractionCount = Column(Integer, nullable=False)


class GradingData(Base):
    __tablename__ = 'grading_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ActivityType = Column(String, nullable=False)
    TotalPointsPossible = Column(DECIMAL(65, 30), nullable=False)
    PointsAchieved = Column(DECIMAL(65, 30), nullable=False)
    IsQuestionCorrect = Column(Boolean, nullable=False)
    AnswerQualityScore = Column(DECIMAL(65, 30), nullable=False)
