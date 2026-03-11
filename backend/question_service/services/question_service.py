from bson.objectid import ObjectId
from datetime import datetime
from fastapi import HTTPException, UploadFile, File
from configurations import collection
from question_service.models.models import Question
from question_service.database.serializers import all_data 
from pymongo.errors import BulkWriteError, DuplicateKeyError
import json

async def get_all_questions_service():
    data = collection.find()
    return all_data(data)

async def get_questions_service(
    page: int = 1,
    limit: int = 10,
    search: str = None
):
    try:
        query = {}

        # Search filter
        if search:
            query["title"] = {
                "$regex": search,
                "$options": "i"
            }

        skip = (page - 1) * limit

        cursor = collection.find(query) \
            .sort([("created_at", -1), ("_id", -1)]) \
            .skip(skip) \
            .limit(limit)

        total = collection.count_documents(query)

        questions = all_data(cursor)

        return {
            "data": questions,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching questions: {e}"
        )


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
    """Update an existing question safely"""
    try:
        id = ObjectId(question_id)

        existing_doc = collection.find_one({"_id": id})

        if not existing_doc:
            raise HTTPException(
                status_code=404,
                detail="Question does not exist"
            )

        update_fields = {
            "description": updated_question.description,
            "category": updated_question.category,
            "complexity": updated_question.complexity,
            "updated_at": datetime.timestamp(datetime.now())
        }

        # ONLY check and update title if changed
        if updated_question.title != existing_doc.get("title"):
            duplicate = collection.find_one({
                "title": updated_question.title,
                "_id": {"$ne": id}
            })

            if duplicate:
                raise HTTPException(
                    status_code=409,
                    detail=f"Question with title '{updated_question.title}' already exists"
                )

            update_fields["title"] = updated_question.title

        collection.update_one(
            {"_id": id},
            {"$set": update_fields}
        )

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
        raise HTTPException(
            status_code=500,
            detail=f"Error updating question: {e}"
        )

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


async def mass_question_upload(file: UploadFile = File()):
    statusObject = {
        'status_code' : 0,
        'message' : ''
    }
    if file is None:
        statusObject['status_code'] = 500
        statusObject['message'] = 'No JSON file detected'
        return statusObject
    data = await file.read()
    questions = json.loads(data)
    try:
        collection.insert_many(questions,ordered=False)
        statusObject['status_code'] = 200
        statusObject['message'] = f'All {len(questions)} questions uploaded successfully'
        return statusObject
    
    except BulkWriteError as e:
        inserted_count = e.details.get('nInserted', 0)
        total_count = len(questions)
        skipped_count = total_count - inserted_count

        if inserted_count == 0:
            statusObject['status_code'] = 409
            statusObject['message'] = f'All {total_count} Questions already exist'
        else:
            statusObject['status_code'] = 207
            statusObject['message'] = f'{inserted_count} Questions uploaded, {skipped_count} Questions already exist'

        return statusObject

    except Exception as e:
        statusObject['status_code'] = 404
        statusObject['message'] = str(e)
        return statusObject



