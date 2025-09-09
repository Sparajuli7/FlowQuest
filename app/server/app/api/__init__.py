from fastapi import APIRouter
from .videoquests import router as videoquests_router

api_router = APIRouter()
api_router.include_router(videoquests_router, prefix="/videoquests", tags=["videoquests"])
