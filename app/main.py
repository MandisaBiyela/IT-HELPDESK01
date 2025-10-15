from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import auth, tickets, reports, escalations
from app.services.sla_monitor import sla_monitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Ndabase IT Helpdesk System...")
    sla_monitor.start()
    logger.info("SLA Monitor started")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    sla_monitor.stop()
    logger.info("SLA Monitor stopped")


# Create FastAPI app
app = FastAPI(
    title="Ndabase IT Helpdesk",
    description="Internal Helpdesk Ticketing System for Ndabase Printing Solutions",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(reports.router)
app.include_router(escalations.router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    """Root endpoint - redirects to frontend"""
    return RedirectResponse(url="/static/index.html")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
