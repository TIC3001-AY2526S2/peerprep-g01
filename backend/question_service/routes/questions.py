from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.security import HTTPBearer
from models.models import Question
from auth_check import verify_access_token, verify_is_admin
from services.question_service import (
    get_questions_service,
    create_question_service,
    update_question_service,
    delete_question_service,
    mass_question_upload,
    get_matching_question
)

router = APIRouter(
    prefix="/questions",
    tags=["questions"]
)

security = HTTPBearer()


@router.get("/", dependencies=[Depends(security)])
async def get_questions(
    page: int = 1,
    limit: int = 10,
    search: str = None,
    _: dict = Depends(verify_access_token),
):
    return await get_questions_service(page, limit, search)


@router.post("/", dependencies=[Depends(security)])
async def create_question(
    question: Question,
    _: dict = Depends(verify_is_admin),
):
    """Create a new question"""
    return await create_question_service(question)


@router.put("/{question_id}", dependencies=[Depends(security)])
async def update_question(
    question_id: str,
    updated_question: Question,
    _: dict = Depends(verify_is_admin),
):
    """Update an existing question"""
    return await update_question_service(question_id, updated_question)


@router.delete("/{question_id}", dependencies=[Depends(security)])
async def delete_question(
    question_id: str,
    _: dict = Depends(verify_is_admin),
):
    """Delete a question"""
    return await delete_question_service(question_id)


@router.post("/upload_questions", dependencies=[Depends(security)])
async def upload_questions(
    file: UploadFile = File(),
    _: dict = Depends(verify_is_admin),
):
    """Mass upload, based on JSON"""
    return await mass_question_upload(file)


@router.get("/random", dependencies=[Depends(security)])
async def get_match_question(
    category: str,
    complexity: str,
    _: dict = Depends(verify_access_token),
):
    return await get_matching_question(category, complexity)