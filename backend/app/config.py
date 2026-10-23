from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./hofdoku.db"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"
    cors_origins: str = "http://localhost:5173"

    seed_betrieb_name: str | None = None
    seed_betrieb_token: str | None = None

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
