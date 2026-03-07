from pydantic import BaseModel
from datetime import datetime

class Question(BaseModel):
    title: str
    description: str
    category: tuple
    complexity: str
    updated_at: int = int(datetime.timestamp(datetime.now()))
    created_at: int = int(datetime.timestamp(datetime.now()))
