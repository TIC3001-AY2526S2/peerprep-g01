import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from configurations import collection
from question_service.routes import questions
from user_service.routes.auth_routes import router as auth_router
from user_service.routes.user_routes import router as user_router
from user_service.model.repository import users_collection

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Questions: seed from JSON if collection is empty ─────────────────
    if collection.count_documents({}) == 0:
        print("[*] Populating database from questions.json...")
        json_path = os.path.join(os.path.dirname(__file__), "question_service/database", "questions.json")
        try:
            with open(json_path, "r") as file:
                data = json.load(file)
            collection.insert_many(data)
            print(f"[+] {len(data)} questions added to MongoDB.")
        except Exception as e:
            print(f"[!] Error loading JSON: {e}")

    # ── Users: ensure indexes on startup ─────────────────────────────────
    try:
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("username", unique=True)
        print("MongoDB user indexes ensured.")
    except Exception as err:
        print("Failed to connect to user DB")
        print(err)
        raise

    yield


app = FastAPI(
    title="PeerPrep API",
    description="API for managing questions and users",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(questions.router)
app.include_router(auth_router)
app.include_router(user_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to the PeerPrep API",
        "docs": "/docs",
    }


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": {"message": "Route Not Found"}})


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"message": str(exc)}})
