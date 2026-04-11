from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import uuid
import requests
import httpx

from core.connection_manager import manager
from services.matcher import try_match, add_to_queue, remove_from_queue

router = APIRouter()

@router.websocket('/ws/match')
async def websocket_match(websocket: WebSocket):
    user_id = None
    data = None
    try:
        await websocket.accept()

        while True:
            data = await websocket.receive_json()
            print('[*] websocket.py - Received:', data)

            if user_id is None:
                user_id = data['user']['id']
                manager.connections[user_id] = websocket
                print(f'[+] websocket.py - Registered user: {user_id}')

            await websocket.send_json({
                'status': 'received',
                'data': data
            })

            matchResult = await try_match(data)
            if matchResult is None:
                await add_to_queue(data)
                print(f'[+] websocket.py - Added user {user_id} to queue')
            else:
                print('[+] websocket.py - Match found!')
                await handle_match(user_id, data, matchResult)

    except WebSocketDisconnect:
        print(f'[*] websocket.py - Client disconnected: {user_id}')
        if user_id:
            manager.disconnect(user_id)
            if data:
                await remove_from_queue(data)

    except Exception as e:
        print(f'[!] websocket.py - Error: {e}')
        if user_id:
            manager.disconnect(user_id)


async def handle_match(user_id, user_data, match):
    match_id = str(uuid.uuid4())
    category = user_data['category']
    complexity = user_data['complexity']

    response = requests.get(
        'http://question-service:8000/questions/internal/get_match_question',
        params={'category': category, 'complexity': complexity}
    )
    if response.status_code != 200:
        print(f"[!] Question service error: {response.status_code} {response.text}")
        question = None
    else:
        question_data = response.json()
        question = question_data[0] if question_data else None

    async with httpx.AsyncClient() as client:
        try:
            collab_response = await client.post(
                'http://collaboration-service:8000/internal/init-session',
                json={'matchId': match_id, 'question': question},
                timeout=5.0
            )
            collab_response.raise_for_status()
            print(f"[+] Collab session initialized for {match_id}")
        except Exception as e:
            print(f"[!] Failed to initialize collab session: {e}")

        try:
            await client.post(
                'http://collaboration-service:8000/internal/save-user-session',
                json={
                    'userId': user_data['user']['id'],
                    'matchId': match_id,
                    'matchedWith': match['user'],
                    'question': question,
                },
                timeout=5.0
            )
        except Exception as e:
            print(f"[!] Failed to save user session for {user_data['user']['id']}: {e}")

        try:
            await client.post(
                'http://collaboration-service:8000/internal/save-user-session',
                json={
                    'userId': match['user']['id'],
                    'matchId': match_id,
                    'matchedWith': user_data['user'],
                    'question': question,
                },
                timeout=5.0
            )
        except Exception as e:
            print(f"[!] Failed to save user session for {match['user']['id']}: {e}")

    await manager.send(user_id, {
        'status': 'matched',
        'match_id': match_id,
        'matched_with': match['user'],
        'question': question
    })

    await manager.send(match['user']['id'], {
        'status': 'matched',
        'match_id': match_id,
        'matched_with': user_data['user'],
        'question': question
    })
