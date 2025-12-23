from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post, User
from app.schemas import UserData, ForUserRead, ReadUserParams, UpdateUserName, UpdateUserAge, UpdateUserEmail, AllPostData
from app.crud.crud_user import create_user, find_user, delete_user, find_user_by_id, update_user, user_s_posts_by_user_id
from app.database import get_session
from app.secur import create_access_token, get_password_hash, verify_password
from app.schemas import UserLogin, Token
from app.crud.crud_user import authenticate_user

router = APIRouter(prefix="/user", tags=["user"])

@router.post("/create", response_model=UserData)
async def user_create(
    user: UserData,
    session: AsyncSession = Depends(get_session)
    ):
    """
    Создать нового пользователя.
    """
    try:
        new_user = await create_user(session=session, input_user=user)
        return new_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка создания пользователя: {str(e)}"
        )


@router.get("/get", response_model=list[UserData])
async def find_user_in_search(
    # data: ForUserRead,
    first_name: str = None,
    second_name: str = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Найти пользователья по имени фамилии
    """
    try:
        # user = await find_user(session=session, user=data)
        user = await find_user(session=session, first_name=first_name, second_name=second_name)
        return user
    except Exception as e:
        # return {"message": f"Error {e}"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка поиска пользователя: {str(e)}"
        )


# @router.get("/get_user_by_id", response_model=ReadUserParams)
@router.get("/get_user_by_id")
async def c_find_user_by_id(
    user_id: int,
    session: AsyncSession = Depends(get_session)
):
    """
    Найти пользователья по id
    """
    try:
        user = await find_user_by_id(session=session, user_id=user_id)
        return user
    except Exception as e:
        # return {"message": f"Error {e}"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка поиска пользователя: {str(e)}"
        )

@router.post("/{user_id}/delete", response_model=dict)
async def user_delete(
    user_id: int,
    input_password: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Удаляет пользователя по id
    """
    try:
        user = await find_user_by_id(session=session, user_id=user_id)
        user_password = user.password
        if user_password == input_password:
            await delete_user(session=session, user_id=user_id)
            return {"message": "user been delited"}
        else:
            return {"message": "You don't have right to perform this action"}
    except Exception as e:
        # return {"message": f"Error {e}"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка удаления пользователя: {str(e)}"
        )


@router.patch("/user_{user_id}/{password}/update_name", response_model=UserData)
async def user_update_name(
    user_id: int,
    user_password: str,
    update_data: UpdateUserName,
    session: AsyncSession = Depends(get_session)
) -> UserData:

    db_user = await find_user_by_id(session=session, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    user_update = update_data.model_dump(exclude_unset=True)
    if not user_update:
        return db_user

    if db_user.password == user_password:
        try:
            new_user_data = await update_user(session=session, user_id=user_id, update_data=user_update)
            if new_user_data is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Не удалось обновить пользователя"
                )
                        
            return new_user_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка обновления пользователя: {str(e)}"
            )


@router.patch("/user_{user_id}/{password}/update_email", response_model=UserData)
async def user_update_email(
    user_id: int,
    user_password: int,
    update_data: UpdateUserEmail,
    session: AsyncSession = Depends(get_session)
) -> UserData:

    db_user = await find_user_by_id(session=session, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    user_update = update_data.model_dump(exclude_unset=True)
    if not update_data:
        return db_user  
    if db_user.password == user_password:
        try:
            new_user_data = await update_user(session=session, user_id=user_id, update_data=user_update)
            if new_user_data is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Не удалось обновить пользователя"
                )
                        
            return new_user_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка обновления пользователя: {str(e)}"
            )


@router.patch("/user_{user_id}/{password}/update_age", response_model=UserData)
async def user_update_age(
    user_id: int,
    user_password: str,
    update_data: UpdateUserAge,
    session: AsyncSession = Depends(get_session)
) -> UserData:

    db_user = await find_user_by_id(session=session, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    user_update = update_data.model_dump(exclude_unset=True)
    if not update_data:
        return db_user
    if db_user.password == user_password:
        try:
            new_user_data = await update_user(session=session, user_id=user_id, update_data=user_update)
            if new_user_data is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Не удалось обновить пользователя"
                )
                        
            return new_user_data
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка обновления пользователя: {str(e)}"
            )

@router.get("/{user_id}/posts", response_model=list[AllPostData])
async def get_user_posts(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    user = await find_user_by_id(session=session, user_id=user_id)
    if user:
        try:
            posts = await user_s_posts_by_user_id(session=session, user_id=user_id)
            return posts if posts else {"message": "posts not found"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"У нас возникла проблема: {str(e)}, мы пытаемся ее исправить"
            )
    else:
        raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"У нас возникла проблема: {str(e)}, мы пытаемся ее исправить"
                )
        # return {"message": "user not found"}


@router.post("/create", response_model=UserData)
async def user_create(
    user: UserData,
    session: AsyncSession = Depends(get_session)
):
    """
    Создать нового пользователя.
    """
    try:
        # Проверяем, существует ли пользователь с таким email
        stmt = select(User).where(User.email == user.email)
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует"
            )
        
        new_user = await create_user(session=session, input_user=user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка создания пользователя: {str(e)}"
        )