from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "MiniMesh"
    APP_ENV: str = "development"
    PORT: int = 8080
    FRONTEND_URL: str = "http://localhost:5174"

    # Provider API keys (Phase 14)
    MESHY_API_KEY: str = ""
    TRIPO_API_KEY: str = ""
    RODIN_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
