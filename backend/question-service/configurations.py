from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "PASTE YOUR URI HERE"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

db = client.questions_db
collection = db["questions_data"]
collection.create_index("title", unique=True)
