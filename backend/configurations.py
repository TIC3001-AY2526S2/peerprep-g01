import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import requests

load_dotenv()
uri = os.getenv("DB_CLOUD_URI")
if not uri:
    raise ValueError("DB_CLOUD_URI not set in .env file")
print (f'[*] URI - {uri}')

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Select database and collection
db = client.questions_db
collection = db["questions_data"]

# Ensure "title" is unique
collection.create_index("title", unique=True)

