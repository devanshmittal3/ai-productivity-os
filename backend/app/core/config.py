
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict



class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI Productivity OS"
    
    # JWT & Security
    SECRET_KEY: str = Field(default="SUPER_SECRET_KEY_PROD_GRADE_CHANGE_ME_NOW_1234567890")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    from pydantic import field_validator

    @field_validator("BACKEND_CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    # Firebase configuration
    FIREBASE_CREDENTIALS_PATH: str = Field(default="")
    FIREBASE_PROJECT_ID: str = Field(default="")
    
    # Gemini Configuration
    GEMINI_API_KEY: str = Field(default="")

settings = Settings()
