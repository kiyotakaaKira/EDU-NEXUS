from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api import (
    health,
    datasets,
    integration,
    quality,
    cleaning,
    statistics,
    eda,
    statistical_analysis,
    features,
    temporal,
    cohorts,
    anomalies,
    insights,
    digital_twin,
    intervention_simulator,
    ml,
)

app = FastAPI(
    title="EduNexus API",
    description="Backend for EduNexus Educational Data Science Framework",
    version="3.0.0"
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Module Routers
app.include_router(health.router)
app.include_router(datasets.router, prefix="/api/datasets")
app.include_router(integration.router, prefix="/api/integration")
app.include_router(quality.router, prefix="/api/quality")
app.include_router(cleaning.router, prefix="/api/cleaning")
app.include_router(statistics.router, prefix="/api/statistics")
app.include_router(eda.router, prefix="/api/eda")
app.include_router(statistical_analysis.router, prefix="/api/statistical_analysis")
app.include_router(features.router, prefix="/api/features")
app.include_router(temporal.router, prefix="/api/temporal")
app.include_router(cohorts.router, prefix="/api/cohorts")
app.include_router(anomalies.router, prefix="/api/anomalies")
app.include_router(insights.router, prefix="/api/insights")
app.include_router(digital_twin.router, prefix="/api/digital-twin")
app.include_router(intervention_simulator.router, prefix="/api/intervention-simulator")
app.include_router(ml.router, prefix="/api/ml")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
