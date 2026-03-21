from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from model.repository import users_collection

load_dotenv()

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Users: ensure indexes on startup
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
    title="PeerPrep User Service",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "PATCH"],
    allow_headers=["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
)

app.include_router(auth_router)
app.include_router(user_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the User Service"}

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": {"message": str(exc)}})