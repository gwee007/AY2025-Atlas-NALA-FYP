from app import create_app
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = create_app()

if __name__ == '__main__':
    logger.info("Starting chatbot backend server...")
    logger.info("Server will be available at http://127.0.0.1:8000")
    app.run(host='0.0.0.0', port=8000, debug=True)
