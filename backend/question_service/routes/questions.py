from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from question_service.models.models import Question
from question_service.services.question_service import (
    get_questions_service,
    create_question_service,
    update_question_service,
    delete_question_service,
    mass_question_upload
)
from user_service.middleware.basic_access_control import (
    verify_access_token,
    verify_is_admin,
)

router = APIRouter(
    prefix="/questions",
    tags=["questions"]
)


@router.get("/")
async def get_questions(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    _: dict = Depends(verify_access_token),
):
    return await get_questions_service(page, limit, search)


@router.post("/")
async def create_question(
    question: Question,
    _: dict = Depends(verify_is_admin),
):
    """Create a new question"""
    return await create_question_service(question)


@router.put("/{question_id}")
async def update_question(
    question_id: str, 
    updated_question: Question,
    _: dict = Depends(verify_is_admin),
):
    """Update an existing question"""
    return await update_question_service(question_id, updated_question)


@router.delete("/{question_id}")
async def delete_question(
    question_id: str,
    _: dict = Depends(verify_is_admin),
):
    """Delete a question"""
    return await delete_question_service(question_id)

@router.post("/upload_questions")
async def upload_questions(
    file: UploadFile = File(),
    _: dict = Depends(verify_is_admin),
):
    # Mass upload, based on JSON
    return await mass_question_upload(file)
