"""
AquaGuard AI – FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import init_db
from app.routes import predict, analytics, models, history, report


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database on startup
    init_db()
    yield


app = FastAPI(
    title="AquaGuard AI API",
    description="Intelligent Machine Learning-Based Water Quality Assessment and Potability Prediction System",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for local React/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Register API routers under /api
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(models.router, prefix="/api", tags=["ML Models"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(report.router, prefix="/api", tags=["Reports"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AquaGuard AI Backend",
        "version": "1.0.0",
    }
