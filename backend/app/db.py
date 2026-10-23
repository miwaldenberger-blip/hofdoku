from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# Render setzt postgres://, SQLAlchemy erwartet postgresql+psycopg://
url = settings.database_url
if url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql+psycopg://", 1)
elif url.startswith("postgresql://"):
    url = url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
engine = create_engine(url, echo=False, pool_pre_ping=True, connect_args=connect_args)


def init_db() -> None:
    """Erstellt fehlende Tabellen. Fuer echte Schema-Aenderungen spaeter Alembic."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
