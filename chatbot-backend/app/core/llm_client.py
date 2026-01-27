import requests
import time
from typing import Any, List, Optional, Mapping
from xml.sax.saxutils import escape  # escaping XML special characters
from langchain_core.language_models.llms import LLM
from app.config import Config

class NalaGemini(LLM):
    api_key: str = Config.NALA_API_KEY
    base_url: str = Config.NALA_BASE_URL
    model_name: str = "gemini-2.5-flash"
    
    # create a persistent session for connection pooling (i.e. dont need create new connection for each request)
    _session = requests.Session()

    @property
    def _llm_type(self) -> str:
        return "gemini-2.5-flash"

    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        system_instruction = kwargs.get("system_instruction", "You are a helpful assistant.")
        retries = kwargs.get("retries", 3)

        # Escape special characters in system_instruction and prompt
        escaped_system_instruction = escape(system_instruction)
        escaped_prompt = escape(prompt)

        xml_body = f"""
        <llm_request>
            <model>{self.model_name}</model>
            <system_prompt>{escaped_system_instruction}</system_prompt>
            <hyperparameters>
                <temperature>0.1</temperature>
                <top_p>0.2</top_p>
            </hyperparameters>
            <user_prompt>{escaped_prompt}</user_prompt>
        </llm_request>
        """
        
        headers = {
            "Content-Type": "application/xml",
            "Authorization": f"Bearer {self.api_key}"
        }

        for attempt in range(1, retries + 1):
            try:
                # use session object to make the request
                response = self._session.post(f"{self.base_url}/api/llm/",
                                              data=xml_body,
                                              headers=headers
                                            )
                response.raise_for_status()
                return response.json()["message"]
            except Exception as e:
                if attempt == retries:
                    print(f"LLM Error: {e}")
                    return "Error generating response."
                time.sleep(1)
        return ""

    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        return {"model": self.model_name}