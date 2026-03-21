import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()
uri = os.getenv("DB_CLOUD_URI")
if not uri:
    raise ValueError("DB_CLOUD_URI not set in .env file")

client = MongoClient(uri, server_api=ServerApi('1'))

# Separate Database for Questions
db = client.questions_db
collection = db["questions_data"]

# Keep your unique title index here
collection.create_index("title", unique=True)