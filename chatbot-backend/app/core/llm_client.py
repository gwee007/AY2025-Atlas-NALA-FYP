import requests
import time
from typing import Any, List, Optional, Mapping
from langchain_core.language_models.llms import LLM
from app.config import Config

class NalaGemini(LLM):
    api_key: str = Config.NALA_API_KEY
    base_url: str = Config.NALA_BASE_URL
    model_name: str = "gemini-3-pro-preview"
    
    @property
    def _llm_type(self) -> str:
        return "nala_gemini_3_pro_preview"

    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        system_instruction = kwargs.get("system_instruction", "You are a helpful assistant.")
        retries = kwargs.get("retries", 3)

        xml_body = f"""
        <llm_request>
            <model>{self.model_name}</model>
            <system_prompt>{system_instruction}</system_prompt>
            <hyperparameters>
                <temperature>0</temperature>
                <top_p>0.1</top_p>
            </hyperparameters>
            <user_prompt>{prompt}</user_prompt>
        </llm_request>
        """
        
        headers = {
            "Content-Type": "application/xml",
            "Authorization": f"Bearer {self.api_key}"
        }

        for attempt in range(1, retries + 1):
            try:
                response = requests.post(f"{self.base_url}/api/llm/", data=xml_body, headers=headers)
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