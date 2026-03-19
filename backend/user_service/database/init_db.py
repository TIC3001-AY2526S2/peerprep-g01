"""
Seeds an admin user into MongoDB.
Run from backend/ folder: python seed_admin.py
"""
import asyncio
import os
import bcrypt
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

ADMIN_EMAIL = "admin@example.com"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin1234!"

async def main():
    client = AsyncIOMotorClient(os.environ["DB_CLOUD_URI"])
    db = client[os.environ.get("DB_NAME", "peerprep")]
    users = db["users"]

    # Check if admin already exists
    existing = await users.find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"Admin already exists: {ADMIN_EMAIL}")
        print("Updating isAdmin to True...")
        await users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"isAdmin": True}}
        )
        print("Done.")
        client.close()
        return

    # Create admin
    hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")
    await users.insert_one({
        "username": ADMIN_USERNAME,
        "email": ADMIN_EMAIL,
        "password": hashed,
        "isAdmin": True,
        "createdAt": datetime.now(timezone.utc),
    })

    print("Admin user seeded successfully!")
    print(f"  email:    {ADMIN_EMAIL}")
    print(f"  password: {ADMIN_PASSWORD}")
    print("  ⚠️  Change this password after first login.")
    client.close()

asyncio.run(main())
