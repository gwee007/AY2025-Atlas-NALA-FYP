from sqlalchemy import Column, BigInteger, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import declarative_base
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class Topic(Base):
    __tablename__ = "topics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_name = Column(Text, unique=True, nullable=False)
    topic_summary = Column(Text, nullable=False)
    topic_summary_embedding = Column(Vector(1024))

class TopicDependency(Base):
    __tablename__ = "topic_dependencies"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column(BigInteger, ForeignKey("topics.id"))
    related_topic_id = Column(BigInteger, ForeignKey("topics.id"))
    relation_type = Column(Text, default="related")

class Subtopic(Base):
    __tablename__ = "subtopics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    topic_id = Column(BigInteger, ForeignKey("topics.id"))
    subtopic_name = Column(Text, nullable=False)
    subtopic_summary = Column(Text, nullable=False)
    subtopic_summary_embedding = Column(Vector(1024))

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    subtopic_id = Column(BigInteger, ForeignKey("subtopics.id"))
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1024))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())