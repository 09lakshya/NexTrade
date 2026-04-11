from fastapi import APIRouter

router = APIRouter(prefix="/recommend")

@router.get("/")
def test():
    return {"message": "recommend working"}