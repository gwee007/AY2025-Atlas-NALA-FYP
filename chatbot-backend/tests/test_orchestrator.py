import asyncio
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.orchestrator import Orchestrator
from app.core.model_loader import model_resources

async def test_orchestrator():
    # Step 0: Load models before testing (mimics Flask app startup)
    print("[Test] Loading models before testing...")
    try:
        model_resources.load_models()
        print("[Test] Models loaded successfully.")
        
        # Verify models are actually loaded
        if not model_resources.is_loaded():
            raise RuntimeError("Models failed to load properly")
            
    except Exception as e:
        print(f"[Test] Failed to load models: {e}")
        return

    # Step 1: Initialize the database session
    db_session = next(get_db())  # Get a database session

    # Step 2: Create an Orchestrator instance
    orchestrator = Orchestrator(db_session)

    # Step 3: Define test inputs
    conversation_id = 1  # Replace with an actual conversation ID from your database
    user_question = "What is the property of Linearity?"

    # Step 4: Call the process_question method
    try:
        result = await orchestrator.process_question(
            conversation_id=conversation_id,
            user_question=user_question
        )
        print("Process Question Result:", result)
    except Exception as e:
        print(f"Error during question processing: {e}")
        return

    # Step 5: Test process_answer (optional)
    question_id = result.get("question_id")  # Use the question ID from the previous step
    if question_id:
        user_answer = "The property of linearity suggests about principles of superposition and homogeneity."

        try:
            answer_result = await orchestrator.process_answer(
                conversation_id=conversation_id,
                question_id=question_id,
                user_answer=user_answer
            )
            print("Process Answer Result:", answer_result)
        except Exception as e:
            print(f"Error during answer processing: {e}")
    else:
        print("No question_id returned, skipping answer test")

    # Clean up database session
    db_session.close()

# Run the test
if __name__ == "__main__":
    asyncio.run(test_orchestrator())
