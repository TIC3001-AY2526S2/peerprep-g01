from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import uuid
import requests

from core.connection_manager import manager
from services.matcher import try_match, add_to_queue, remove_from_queue

router = APIRouter()

@router.websocket('/ws/match')
async def websocket_match(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            print('[*] websocket.py - Received:', data)

            await websocket.send_json({
                'status': 'received',
                'data': data
            })
            print('[+] websocket.py - Sucessfully sent back websocket json object')
            matchResult = await try_match(data)
            if matchResult == None:
                await add_to_queue(data)
            else:
                print('[+] websocket.py - Match found!')
                # await handle_match(data['user_id'], data, matchResult)

    except WebSocketDisconnect:
        print('[*] websocket.py - Client disconnected')

    except Exception as e:
        print('[!] websocket.py - Error:', e)


# TODO
async def handle_match(user_id, user_data, match):
    match_id = str(uuid.uuid4())
    topic = user_data['topic']
    complexity = user_data['complexity']
    response = requests.get(
        'http://question-service:8000/questions',
        params={'topic': topic, 'complexity': complexity}
    )
    question = response.json()
    # Send to both users 
    await manager.send(user_id, {
        'status': 'matched',
        'match_id': match_id,
        'question': question
    })
    await manager.send(match['user_id'], {
        'status': 'matched',
        'match_id': match_id,
        'question': question
    })