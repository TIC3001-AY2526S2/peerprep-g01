import os

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from model.user_model import COLLECTION_NAME, new_user_doc

load_dotenv()

# connectToDB
MONGO_URI = (
    os.environ["DB_CLOUD_URI"]
    if os.environ.get("ENV") == "PROD"
    else os.environ.get("DB_LOCAL_URI", "mongodb://localhost:27017")
)

client = AsyncIOMotorClient(MONGO_URI)
db = client[os.environ.get("DB_NAME", "peerprep")]
users_collection = db[COLLECTION_NAME]


# Repository functions 

async def create_user(username: str, email: str, password: str) -> dict:
    """Mirrors: new UserModel({ username, email, password }).save()"""
    doc = new_user_doc(username, email, password)
    result = await users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def find_user_by_email(email: str) -> dict | None:
    """Mirrors: UserModel.findOne({ email })"""
    return await users_collection.find_one({"email": email})


async def find_user_by_id(user_id: str) -> dict | None:
    """Mirrors: UserModel.findById(userId)"""
    try:
        return await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


async def find_user_by_username(username: str) -> dict | None:
    """Mirrors: UserModel.findOne({ username })"""
    return await users_collection.find_one({"username": username})


async def find_user_by_username_or_email(username: str, email: str) -> dict | None:
    """Mirrors: UserModel.findOne({ $or: [{ username }, { email }] })"""
    return await users_collection.find_one({
        "$or": [{"username": username}, {"email": email}]
    })


async def find_all_users() -> list[dict]:
    """Mirrors: UserModel.find()"""
    return await users_collection.find().to_list(length=None)


async def update_user_by_id(user_id: str, username: str, email: str, password: str) -> dict | None:
    """Mirrors: UserModel.findByIdAndUpdate(userId, { $set: {...} }, { new: true })"""
    updates = {}
    if username is not None:
        updates["username"] = username
    if email is not None:
        updates["email"] = email
    if password is not None:
        updates["password"] = password

    return await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": updates},
        return_document=True,
    )


async def update_user_privilege_by_id(user_id: str, is_admin: bool) -> dict | None:
    """Mirrors: UserModel.findByIdAndUpdate(userId, { $set: { isAdmin } }, { new: true })"""
    return await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"isAdmin": is_admin}},
        return_document=True,
    )


async def delete_user_by_id(user_id: str) -> None:
    """Mirrors: UserModel.findByIdAndDelete(userId)"""
    await users_collection.delete_one({"_id": ObjectId(user_id)})
