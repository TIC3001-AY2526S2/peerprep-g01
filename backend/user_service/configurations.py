import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("DB_CLOUD_URI")
if not uri:
    raise ValueError("DB_CLOUD_URI not set in .env file")

client = MongoClient(uri, server_api=ServerApi('1'))

# Separate Database for Users
db = client.users_db
collection = db["users_data"]

# The user service doesn't need the "title" index,
# it handles email/username indexes in main.py