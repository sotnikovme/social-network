from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import Field

from app.database import get_session
import app.crud.crud_post as crud_post
import app.schemas as schemas
import app.models as models
from app.auth import get_current_active_user


router = APIRouter(prefix="/post", tags=["post"])


@router.post("/create", response_model=schemas.PostData)
async def create_post(
    post_data: schemas.PostData,
    current_user: schemas.UserData = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):  
    if post_data.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя создавать посты от имени другого пользователя"
        )
    
    try:
        db_post = await crud_post.create_post(session=session, post_data=post_data)
        return db_post if db_post else None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания поста: {str(e)}"
        )


@router.get("/get_by_id", response_model=schemas.AllPostData)
async def get_post_by_id(
    post_id: int,
    session: AsyncSession = Depends(get_session),
): 
    post = await crud_post.get_posts_by_id(session=session, post_id=post_id)
    if post:
        return post
    else: 
        return{"message": "пост не найден"}


@router.get("/get_by_title", response_model=schemas.AllPostData)
async def get_post_by_title(
    title: str = Query(max_length=200, min_length=1, description="заголовок"),
    # title: str = Field(max_length=200, min_length=1, description="заголовок"),
    session: AsyncSession = Depends(get_session),
):  
    try:
        post = await crud_post.get_posts_by_title(session=session, post_title=title)
        if post:
            return post
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания поста: {str(e)}"
        )
    
    
    
@router.patch("/post_{user_id}/update_title", response_model=schemas.PostUpdate)
async def post_update_title(
    post_id: int,
    update_data: str = Query(max_length=200, min_length=1, description="заголовок"),
    session: AsyncSession = Depends(get_session)
):
    try:
        data = {"title": f"{update_data}"}
        new_post_data = await crud_post.update_post(session=session, post_id=post_id, update_data=data)
        if new_post_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пост не найден"
            )
        return new_post_data
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка обновления: {str(e)}"
        )


