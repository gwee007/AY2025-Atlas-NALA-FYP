from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, text
from app.database.models import Subtopic, DocumentChunk
from app.core.model_loader import model_resources
from typing import List
import logging

logger = logging.getLogger(__name__)

class RAGService:
    """
    RAG Service uses shared model_resources singleton to access embedding and reranker models.
    """
    def __init__(self, db_session: Session) -> None:
        """
        Initialize the RAGService with a database session.
        Uses pre-loaded models from model_resources singleton.
        """
        if db_session is None:
            raise ValueError("Database session not found")
        self.db = db_session
        
        # Access shared model instances (already loaded during app startup)
        if not model_resources.is_loaded():
            raise RuntimeError("Models not loaded. Ensure models are loaded during app initialization.")
        
        self.embedding_model = model_resources.get_embedding_model()
        self.reranker_model = model_resources.get_reranker_model()
        logger.debug("[RAGService] Using shared model instances.")
    
    def retrieve_subtopics(self, question: str, top_k: int = 3) -> List[Subtopic]:
        """
        Retrieve top-k most relevant subtopics based on cosine similarity
        between question embedding and subtopic summary embeddings.
        
        Returns a list of Subtopic objects with loaded topic relationships.
        """
        # validation for input
        if not question or not isinstance(question, str):
            raise ValueError("Invalid question input")
        
        try:
            # embed question
            question_embedding = self.embedding_model.encode(question).tolist()
            
            # query all subtopic summaries and compute cosine similarity with question embedding
            stmt = (
                select(Subtopic)
                .options(joinedload(Subtopic.topic))
                .order_by(Subtopic.subtopic_summary_embedding.cosine_distance(question_embedding))
                .limit(top_k)
            )
            
            results = list(self.db.execute(stmt).scalars().unique().all())

            if not results:
                logger.warning(f"No subtopics found for question: {question}")
                return []
            logger.info(f"Retrieved {len(results)} subtopics for question.")

            return results
        
        except Exception as e:
            logger.error(f"Error retrieving subtopics: {e}")
            raise RuntimeError(f"Error retrieving subtopics: {e}")
        

    def retrieve_document_chunks(self, question: str, relevant_subtopic_ids: List[int], top_k: int = 10, rerank_top_k: int = 3) -> List[DocumentChunk]:
        """
        Retrieve top document chunks from specific subtopics using HNSW index search,
        then rerank to get the most relevant chunks.
        """

        # validation for input
        if not question or not isinstance(question, str):
            raise ValueError("Invalid question input")
        
        if not relevant_subtopic_ids:
            logger.warning("No relevant subtopic IDs provided")
            return []
        
        try:
            # set HNSW search parameter for better recall
            self.db.execute(text("SET LOCAL hnsw.ef_search = 100"))
            
            question_embedding = self.embedding_model.encode(question).tolist()
            
            # retrieve initial document chunks of subtopics falling under relevant_subtopic_ids
            stmt = (
                select(DocumentChunk)
                .options(joinedload(DocumentChunk.subtopic))
                .where(DocumentChunk.subtopic_id.in_(relevant_subtopic_ids))
                .order_by(DocumentChunk.embedding.cosine_distance(question_embedding))
                .limit(top_k)
            )

            chunks = list(self.db.execute(stmt).scalars().unique().all())
            
            if not chunks:
                logger.warning(f"No document chunks found for subtopic IDs: {relevant_subtopic_ids}")
                return []
            
            if len(chunks) <= rerank_top_k:
                logger.info(f"Retrieved {len(chunks)}; skipping reranking.")
                return chunks

            query_passage_pairs = [[question, chunk.content] for chunk in chunks]

            # get reranked scores
            rerank_scores = self.reranker_model.compute_score(query_passage_pairs, normalize=True)
            
            if not isinstance(rerank_scores, list):
                rerank_scores = [rerank_scores]
            
            # sort chunks by rerank scores
            scored_results = []
            for i, chunk in enumerate(chunks):
                scored_results.append({
                    'score': rerank_scores[i],
                    'chunk': chunk
                })
            
            scored_results.sort(key=lambda x: x['score'], reverse=True)
            reranked_chunks = [item['chunk'] for item in scored_results[:rerank_top_k]]
            return reranked_chunks
        
        except Exception as e:
            logger.error(f"Error retrieving document chunks: {e}")
            raise RuntimeError(f"Error retrieving document chunks: {e}")