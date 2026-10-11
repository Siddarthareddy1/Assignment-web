import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import documents, practice, solutions, attempts, analytics, retention

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("studypath")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StudyPath backend services...")
    logger.info(f"Environment: {settings.ENVIRONMENT} (Demo Mode: {settings.DEMO_MODE})")
    yield
    logger.info("Shutting down StudyPath backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personalized Study Assistant API for generating original practice materials and constructive feedback.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(practice.router, prefix=f"{settings.API_V1_STR}/practice-sets", tags=["Practice Generator"])
app.include_router(solutions.router, prefix=f"{settings.API_V1_STR}/solutions", tags=["Solutions & Hints"])
app.include_router(attempts.router, prefix=f"{settings.API_V1_STR}/attempts", tags=["Attempts & Feedback"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/progress", tags=["Analytics & Progress"])
app.include_router(retention.router, prefix=f"{settings.API_V1_STR}/retention", tags=["Retention & Privacy"])

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "StudyPath API",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
        "demoMode": settings.DEMO_MODE
    }

@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "StudyPath API is operating.",
        "documentation": "/docs",
        "health": "/api/health"
    }
