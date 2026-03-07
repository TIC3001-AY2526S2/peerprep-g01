import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import requests

# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from the environment variable
uri = os.getenv("DB_CLOUD_URI")

print (f'[*] URI - {uri}')

ip_request = requests.get('https://ipwho.is')
data = ip_request.json()
print(f'[+] IP Address - {data.get('ip')}')

if not uri:
    raise ValueError("DB_CLOUD_URI not set in .env file")

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Select database and collection
db = client.questions_db
collection = db["questions_data"]

# Ensure "title" is unique
collection.create_index("title", unique=True)
