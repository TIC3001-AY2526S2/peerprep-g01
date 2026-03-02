from bson.objectid import ObjectId
from datetime import datetime
from fastapi import HTTPException
from configurations import collection
from models.models import Question
from database.serializers import all_data 
from pymongo.errors import DuplicateKeyError

async def get_all_questions_service():
    data = collection.find()
    return all_data(data)


async def create_question_service(question: Question):
    """Create a new question in the database"""
    try:
        question.created_at = datetime.timestamp(datetime.now())
        question.updated_at = datetime.timestamp(datetime.now())
        result = collection.insert_one(dict(question))
        
        return {
            "status_code": 201,
            "message": "Question created successfully",
            "id": str(result.inserted_id)
        }
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail=f"Question with title '{question.title}' already exists"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating question: {e}")


async def update_question_service(question_id: str, updated_question: Question):
    """Update an existing question"""
    try:
        id = ObjectId(question_id)
        existing_doc = collection.find_one({"_id": id})
        
        if not existing_doc:
            raise HTTPException(status_code=404, detail="Question does not exist")
        
        updated_question.updated_at = datetime.timestamp(datetime.now())
        collection.update_one({"_id": id}, {"$set": dict(updated_question)})
        
        return {
            "status_code": 200,
            "message": "Question updated successfully"
        }
    except HTTPException:
        raise
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail=f"Question with title '{updated_question.title}' already exists"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating question: {e}")


async def delete_question_service(question_id: str):
    """Delete a question from the database"""
    try:
        id = ObjectId(question_id)
        existing_doc = collection.find_one({"_id": id})
        
        if not existing_doc:
            raise HTTPException(status_code=404, detail="Question does not exist")
        
        collection.delete_one({"_id": id})
        
        return {
            "status_code": 200,
            "message": "Question deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting question: {e}")
