import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import chargen, hygiene, kontrolle
from app.seed import seed

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed()
    yield


app = FastAPI(
    title="Hofdoku API",
    description="Dokumentation für kleine verarbeitende Direktvermarkter.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chargen.router)
app.include_router(hygiene.router)
app.include_router(kontrolle.router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok"}
