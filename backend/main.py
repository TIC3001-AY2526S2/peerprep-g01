from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from question_service.routes import questions

app = FastAPI(
    title="Questions API",
    description="API for managing questions",
    version="1.0.0"
)

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(questions.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to the Questions API",
        "docs": "/docs"
    }
