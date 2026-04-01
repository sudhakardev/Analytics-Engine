"""
Future Decision Engine - Main FastAPI Application
Production-ready predictive analytics backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import uvicorn

from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, datasets, models, predictions

# ─── Logging Setup ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── App Initialization ───────────────────────────────────────────────────────
app = FastAPI(
    title="Future Decision Engine",
    description="Production-ready Predictive Analytics API with ML capabilities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Init ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Create all tables on startup."""
    logger.info("Starting Future Decision Engine...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Future Decision Engine...")

# ─── Include Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(datasets.router,    prefix="/api/datasets",    tags=["Datasets"])
app.include_router(models.router,      prefix="/api/models",      tags=["Models"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "Future Decision Engine", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
