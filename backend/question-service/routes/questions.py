from fastapi import APIRouter, HTTPException
from models.models import Question
from services.question_service import (
    get_questions_service,
    create_question_service,
    update_question_service,
    delete_question_service
)

router = APIRouter(
    prefix="/questions",
    tags=["questions"]
)


@router.get("/")
async def get_questions(
    page: int = 1,
    limit: int = 10,
    search: str = None
):
    return await get_questions_service(page, limit, search)


@router.post("/")
async def create_question(question: Question):
    """Create a new question"""
    return await create_question_service(question)


@router.put("/{question_id}")
async def update_question(question_id: str, updated_question: Question):
    """Update an existing question"""
    return await update_question_service(question_id, updated_question)


@router.delete("/{question_id}")
async def delete_question(question_id: str):
    """Delete a question"""
    return await delete_question_service(question_id)
