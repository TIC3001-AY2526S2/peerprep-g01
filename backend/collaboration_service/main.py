import os
import json
import base64
import asyncio
import httpx
import redis.asyncio as aioredis
import socketio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
JUDGE0_URL = os.getenv("JUDGE0_URL", "https://judge0-ce.p.rapidapi.com")
JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "")
JUDGE0_HOST = "judge0-ce.p.rapidapi.com"

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
    language_id: int
    stdin: str | None = ""


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
    """Proxy to Judge0 RapidAPI."""
    async with httpx.AsyncClient() as client:
        try:
            submit_res = await client.post(
                f"{JUDGE0_URL}/submissions?base64_encoded=true&wait=false",
                json={
                    "source_code": base64.b64encode(data.source_code.encode()).decode(),
                    "language_id": data.language_id,
                    "stdin": base64.b64encode((data.stdin or "").encode()).decode(),
                },
                headers={
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_HOST,
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
            print(f"[Judge0] submit status={submit_res.status_code} body={submit_res.text}")
            submit_res.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Judge0 submission failed: {e}")

        token = submit_res.json().get("token")
        if not token:
            raise HTTPException(status_code=502, detail="No token from Judge0")

        for _ in range(20):
            await asyncio.sleep(0.5)
            try:
                result_res = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}?base64_encoded=true",
                    headers={
                        "X-RapidAPI-Key": JUDGE0_API_KEY,
                        "X-RapidAPI-Host": JUDGE0_HOST,
                    },
                    timeout=5.0,
                )
                result = result_res.json()
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Judge0 polling failed: {e}")

            status_id = result.get("status", {}).get("id")
            if status_id not in (1, 2):
                def decode(val):
                    if not val:
                        return None
                    try:
                        return base64.b64decode(val).decode("utf-8", errors="replace")
                    except Exception:
                        return val

                return {
                    "status": result.get("status", {}).get("description", "Unknown"),
                    "stdout": decode(result.get("stdout")),
                    "stderr": decode(result.get("stderr")),
                    "compile_output": decode(result.get("compile_output")),
                    "time": result.get("time"),
                    "memory": result.get("memory"),
                }

        raise HTTPException(status_code=504, detail="Execution timed out")


@app.get("/")
async def root():
    return {"service": "Collaboration Service", "status": "online"}


@sio.event
async def connect(sid, environ):
    print(f"[+] Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"[-] Client disconnected: {sid}")


@sio.event
async def join_room(sid, data):
    match_id = data.get('matchId')
    if match_id:
        await sio.enter_room(sid, match_id)
        print(f"[+] {sid} joined room {match_id}")


@sio.event
async def request_history(sid, data):
    match_id = data.get('matchId')
    if match_id:
        existing_code = await redis_client.get(f"code:{match_id}")
        if existing_code:
            await sio.emit('code_received', {'content': existing_code}, to=sid)
            print(f"[+] Sent history to {sid} for room {match_id}")


@sio.event
async def code_update(sid, data):
    match_id = data.get('matchId')
    content = data.get('content')
    if match_id and content is not None:
        await redis_client.set(f"code:{match_id}", content, ex=86400)
        await sio.emit(
            'code_received',
            {'content': content},
            room=match_id,
            skip_sid=sid
        )
        print(f"[*] Room {match_id} synced by {sid}")


@sio.event
async def chat_message(sid, data):
    match_id = data.get('matchId')
    if not match_id:
        return
    await sio.emit(
        'chat_message',
        {
            'sender': data.get('sender', 'Anonymous'),
            'message': data.get('message', ''),
            'senderId': data.get('senderId'),
        },
        room=match_id,
        skip_sid=sid
    )
    print(f"Chat in room {match_id} from {data.get('sender')}: {data.get('message')}")


@sio.event
async def leave_room(sid, data):
    match_id = data.get('matchId')
    if match_id:
        await sio.leave_room(sid, match_id)
        print(f"[-] {sid} left room {match_id}")


@sio.event
async def stdin_update(sid, data):
    match_id = data.get("matchId")
    if not match_id:
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
    if not match_id:
        return
    await sio.emit(
        "language_change",
        {"languageId": data.get("languageId")},
        room=match_id,
        skip_sid=sid
    )
