import redis


# This is for main deployment
redis_client = redis.Redis(
    host="redis",
    decode_responses=True
)

# This is for development deployment - Docker compose the redis container only
# redis_client = redis.Redis(
#     host="localhost",
#     port="6379",
#     decode_responses=True
# )
