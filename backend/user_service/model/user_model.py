from datetime import datetime, timezone

# ── User document schema ──────────────────────────────────────────────────────
# Mirrors the Mongoose UserModelSchema in user-model.js.
# Motor doesn't have an ODM layer, so this file serves as documentation
# of the expected document shape and provides the default values used on insert.
#
# Schema:
#   username  : str,  required, unique
#   email     : str,  required, unique
#   password  : str,  required
#   isAdmin   : bool, required, default False
#   createdAt : date, default now

COLLECTION_NAME = "users"


def new_user_doc(username: str, email: str, password: str) -> dict:
    """
    Mirrors: new UserModel({ username, email, password })
    Returns a fresh document dict with all schema defaults applied,
    ready to be passed to insert_one().
    """
    return {
        "username": username,
        "email": email,
        "password": password,
        "isAdmin": False,                        # default: false
        "createdAt": datetime.now(timezone.utc), # default: Date.now
    }
