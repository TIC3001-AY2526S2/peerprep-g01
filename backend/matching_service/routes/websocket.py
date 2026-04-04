from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import uuid
import requests

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

            # Register user in connection manager on first message
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
    question_data = response.json()
    question = question_data[0] if question_data else None

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