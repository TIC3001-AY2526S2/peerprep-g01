import json
import os
from configurations import collection
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import questions

async def lifespan(app: FastAPI):
    # This block runs on STARTUP
    if collection.count_documents({}) == 0:
        print("[*] Populating database from questions.json...")
        json_path = os.path.join(os.path.dirname(__file__), "database", "questions.json")
        try:
            with open(json_path, "r") as file:
                data = json.load(file)
            collection.insert_many(data)
            print(f"[+] {len(data)} questions added to MongoDB.")
        except Exception as e:
            print(f"[!] Error loading JSON: {e}")
    yield

app = FastAPI(
    title="Questions API",
    description="API for managing questions",
    version="1.0.0",
    lifespan=lifespan
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
