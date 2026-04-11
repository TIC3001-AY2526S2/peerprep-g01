import os
import json
import httpx
import jwt
import redis.asyncio as aioredis
import socketio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
PISTON_URL = os.getenv("PISTON_URL", "http://piston:2000/api/v2")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

# ── JWT helper ────────────────────────────────────────────────────────────────
 
def verify_token(token: str) -> str | None:
    """Returns userId (str) if token is valid, None otherwise."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("id")           # ← matches {"id": str(user["_id"]), ...}
    except jwt.ExpiredSignatureError:
        print("[!] Token expired")
        return None
    except jwt.InvalidTokenError:
        print("[!] Invalid token")
        return None
    

# ── Socket.IO membership helper ───────────────────────────────────────────────
 
async def assert_member(sid: str, match_id: str) -> bool:
    """
    Returns True if the socket's verified user belongs to match_id.
    Emits an 'error' event and returns False otherwise.
    """
    session = await sio.get_session(sid)
    user_id = session.get("userId")
    raw = await redis_client.get(f"user_session:{user_id}")
    if not raw or json.loads(raw).get("matchId") != match_id:
        await sio.emit("error", {"message": "Unauthorized"}, to=sid)
        return False
    return True

# ── Socket.IO / FastAPI setup ─────────────────────────────────────────────────

mgr = socketio.AsyncRedisManager(REDIS_URL)
sio = socketio.AsyncServer(
    async_mode='asgi',
    client_manager=mgr,
    cors_allowed_origins='*'
)

app = FastAPI(title="PeerPrep Collaboration Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

combined_app = socketio.ASGIApp(sio, app, socketio_path="/socket.io")

redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

# ── Pydantic models ───────────────────────────────────────────────────────────

class SessionInit(BaseModel):
    matchId: str
    question: dict

class SaveCode(BaseModel):
    content: str
    userId: str | None = None

class UserSessionPayload(BaseModel):
    userId: str
    matchId: str
    matchedWith: dict | None = None
    question: dict | None = None

class ExecuteRequest(BaseModel):
    source_code: str
    language: str        
    version: str = "*"  
    stdin: str | None = ""

# ── REST endpoints ────────────────────────────────────────────────────────────

@app.post("/internal/init-session")
async def init_session(data: SessionInit):
    """Called by Matching Service once a match is found."""
    try:
        await redis_client.set(f"question:{data.matchId}", json.dumps(data.question), ex=86400)
        exists = await redis_client.exists(f"code:{data.matchId}")
        if not exists:
            await redis_client.set(f"code:{data.matchId}", "# Start collaborating...\n", ex=86400)
        print(f"Session {data.matchId} initialized.")
        return {"status": "success", "matchId": data.matchId}
    except Exception as e:
        print(f"Error initializing session: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/internal/save-user-session")
async def save_user_session(data: UserSessionPayload):
    """
    Called by Matching Service for each user after a match is found.
    Persists the session info tied to userId so it survives logout/device changes.
    No TTL — cleared explicitly on exit or dismiss.
    """
    try:
        payload = {
            "matchId": data.matchId,
            "matchedWith": data.matchedWith,
            "question": data.question,
            "userId": data.userId,
        }
        await redis_client.set(f"user_session:{data.userId}", json.dumps(payload))
        print(f"[+] User session saved for {data.userId} -> room {data.matchId}")
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving user session: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user session")


@app.get("/session/user/{userId}")
async def get_user_session(userId: str):
    """Returns the active session for a user, if any."""
    raw = await redis_client.get(f"user_session:{userId}")
    if not raw:
        return {"session": None}
    return {"session": json.loads(raw)}


@app.delete("/session/user/{userId}")
async def delete_user_session(userId: str):
    """Clears the active session for a user on exit or dismiss."""
    await redis_client.delete(f"user_session:{userId}")
    print(f"[-] User session cleared for {userId}")
    return {"status": "cleared"}


@app.get("/session/{matchId}")
async def get_session(matchId: str):
    """Fetches current session state — used for page refresh / rejoin."""
    question = await redis_client.get(f"question:{matchId}")
    code = await redis_client.get(f"code:{matchId}")
    saved = await redis_client.get(f"saved_code:{matchId}")
    return {
        "question": json.loads(question) if question else None,
        "code": code or "",
        "savedCode": saved or None,
    }


@app.post("/session/{matchId}/save")
async def save_code(matchId: str, data: SaveCode):
    """Permanently saves the current code snapshot."""
    try:
        payload = {
            "content": data.content,
            "savedBy": data.userId,
            "matchId": matchId,
        }
        await redis_client.set(f"saved_code:{matchId}", json.dumps(payload))
        print(f"Code saved permanently for session {matchId} by user {data.userId}")
        return {"status": "saved", "matchId": matchId}
    except Exception as e:
        print(f"Error saving code: {e}")
        raise HTTPException(status_code=500, detail="Failed to save code")


@app.post("/execute")
async def execute_code(data: ExecuteRequest):
    """Proxy to Piston API — free, no key required."""
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                f"{PISTON_URL}/execute",
                json={
                    "language": data.language,
                    "version": data.version,
                    "files": [{"content": data.source_code}],
                    "stdin": data.stdin or "",
                },
                timeout=15.0,
            )
            print(f"[Piston] status={res.status_code}")
            res.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Piston request failed: {e}")

        result = res.json()
        run = result.get("run", {})
        compile_stage = result.get("compile", {})

        return {
            "status": "Runtime Error" if run.get("code") != 0 else "Accepted",
            "stdout": run.get("stdout") or None,
            "stderr": run.get("stderr") or None,
            "compile_output": compile_stage.get("stderr") or None,
            "time": None,
            "memory": None,
        }


@app.get("/")
async def root():
    return {"service": "Collaboration Service", "status": "online"}


# ── Socket.IO events ──────────────────────────────────────────────────────────

@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get("token")
    if not token:
        print(f"[!] Rejected — no token: {sid}")
        return False
 
    user_id = verify_token(token)
    if not user_id:
        print(f"[!] Rejected — invalid/expired token: {sid}")
        return False
 
    # Stash verified identity for use in all subsequent events
    await sio.save_session(sid, {"userId": user_id})
    print(f"[+] Authenticated connection: {sid} -> user {user_id}")

@sio.event
async def disconnect(sid):
    print(f"[-] Client disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.enter_room(sid, match_id)
    session = await sio.get_session(sid)
    print(f"[+] {session.get('userId')} joined room {match_id}")


@sio.event
async def request_history(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    existing_code = await redis_client.get(f"code:{match_id}")
    if existing_code:
        await sio.emit("code_received", {"content": existing_code}, to=sid)
        print(f"[+] Sent history to {sid} for room {match_id}")


@sio.event
async def code_update(sid, data):
    match_id = data.get("matchId")
    content = data.get("content")
    if not match_id or not await assert_member(sid, match_id):
        return
    if content is not None:
        await redis_client.set(f"code:{match_id}", content, ex=86400)
        await sio.emit(
            "code_received",
            {"content": content},
            room=match_id,
            skip_sid=sid
        )
        print(f"[*] Room {match_id} synced by {sid}")


@sio.event
async def chat_message(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.emit(
        "chat_message",
        {
            "sender": data.get("sender", "Anonymous"),
            "message": data.get("message", ""),
            "senderId": data.get("senderId"),
        },
        room=match_id,
        skip_sid=sid
    )
    print(f"Chat in room {match_id} from {data.get('sender')}: {data.get('message')}")


@sio.event
async def leave_room(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.leave_room(sid, match_id)
    print(f"[-] {sid} left room {match_id}")


@sio.event
async def stdin_update(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.emit(
        "stdin_update",
        {"stdin": data.get("stdin", "")},
        room=match_id,
        skip_sid=sid
    )


@sio.event
async def language_change(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.emit(
        "language_change",
        {"languageId": data.get("languageId")},
        room=match_id,
        skip_sid=sid
    )

@sio.event
async def cursor_update(sid, data):
    match_id = data.get("matchId")
    if not match_id or not await assert_member(sid, match_id):
        return
    await sio.emit(
        "cursor_update",
        {
            "userId": data.get("userId"),
            "username": data.get("username"),
            "position": data.get("position"),
        },
        room=match_id,
        skip_sid=sid
    )