import json
import os
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from configurations import collection
from routes import questions


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Questions: seed from JSON if collection is empty 
    if collection.count_documents({}) == 0:
        json_path = os.path.join(os.path.dirname(__file__), "question_service/database", "questions.json")
        try:
            with open(json_path, "r") as file:
                data = json.load(file)
            collection.insert_many(data)
            print(f"[+] Seeded {len(data)} questions.")
        except Exception as e:
            print(f"[!] Seed Error: {e}")
    yield

app = FastAPI(title="PeerPrep Question Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router)

@app.get("/")
async def root():
    return {"service": "Question Service", "status": "online"}