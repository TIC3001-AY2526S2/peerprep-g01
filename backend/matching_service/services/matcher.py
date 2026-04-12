import json
from core.redis_client import redis_client

def queue_key(category):
    # Get the queue for this specific category
    return f'queue:{category}'

async def try_match(user):
    key = queue_key(user['category'])
    # LRANGE takes in the key, start, and end
    users = redis_client.lrange(key, 0, -1)
    try:
        for queueUser in users:
            parsed = json.loads(queueUser)

            if parsed['complexity'] == user['complexity']:
                redis_client.lrem(key, 1, queueUser)
                print('[+] matcher.py - Matches found, returning the user')
                return parsed
        
        # If somehow above fails, use this
        if users:
            queueUser = users[0]
            redis_client.lrem(key, 1, queueUser)
            return json.loads(queueUser)
    
    except Exception as e:
        print(f'[!] matcher.py - Error: {e}')

    return None


async def add_to_queue(user):
    key = queue_key(user['category'])
    redis_client.rpush(key, json.dumps(user))


async def remove_from_queue(user):
    key = queue_key(user['category'])
    redis_client.lrem(key, 0, json.dumps(user))