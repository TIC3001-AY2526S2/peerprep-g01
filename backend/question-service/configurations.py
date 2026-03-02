from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://Ron:rKy9e6oC4LuKTpBK@tic3001.yfgchgn.mongodb.net/?appName=TIC3001"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

db = client.questions_db
collection = db["questions_data"]
collection.create_index("title", unique=True)
