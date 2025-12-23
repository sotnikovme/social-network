from typing import Optional
from sqlalchemy import select, or_
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext


from sqlalchemy.ext.asyncio import AsyncSession
from app.secur import get_password_hash, verify_password
from app.schemas import ReadUserParams, UserData, ForUserRead
from app.models import Post, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Хэширует пароль"""
    return pwd_context.hash(password)


async def create_user(
    session: AsyncSession,
    input_user: UserData
) -> User:
    
    hashed_password = get_password_hash(input_user.password)
    
    db_user = User(
        first_name=input_user.first_name,
        second_name=input_user.second_name,
        email=input_user.email,
        password=hashed_password,
        age=input_user.age,
        gender=input_user.gender
    )
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    
    return db_user

async def find_user(
    session: AsyncSession,
    first_name: str = None, 
    second_name: str = None,
    skip: int = 0,
    limit: int = 20
) -> list[User]:
    
    stmt = select(User)
    
    if first_name and second_name:
        stmt = stmt.where(
            User.first_name.ilike(f"%{first_name}%"),
            User.second_name.ilike(f"%{second_name}%")
        )
    elif first_name:
        stmt = stmt.where(User.first_name.ilike(f"%{first_name}%"))
    elif second_name:
        stmt = stmt.where(User.second_name.ilike(f"%{second_name}%"))
    
    stmt = stmt.offset(skip).limit(limit)
    
    result = await session.execute(stmt)
    users = result.scalars().all()
    
    return users

# async def find_user(
#     session: AsyncSession,
#     # name: ForUserRead,
#     first_name: str = None, 
#     second_name: str = None,
#     skip: int = 0,
#     limit: int = 20
# ) -> list[User]:
    
#     stmt = select(User).where(
#         or_(
#             User.first_name.ilike(f"%{first_name}%"),
#             User.second_name.ilike(f"%{second_name}%")
#         )
#     ).offset(skip).limit(limit)
    
#     result = await session.execute(stmt)
#     users = result.scalars().all()
    
#     return users


async def check_user_by_id(
    session: AsyncSession,
    user_id: int,
) -> bool:
    
    stmt = select(User).where(User.id == user_id)
    
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        return True
    else: 
        return False


async def find_user_by_id(
    session: AsyncSession,
    user_id: int,
) -> UserData:
    
    stmt = select(User).where(User.id == user_id)
    
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    # return ReadUserParams(
    #     first_name=user.first_name,
    #     second_name=user.second_name,
    #     email=user.email,
    #     age=user.age,
    #     gender=user.gender,
    # )
    return UserData(
        first_name=user.first_name,
        second_name=user.second_name,
        email=user.email,
        age=user.age,
        gender=user.gender,
        password=user.password 
    )


async def update_user(
    session: AsyncSession,
    user_id: int,
    update_data: dict
) -> UserData:
    user = await find_user_by_id(session=session, user_id=user_id)
    
    if not user:
        return False
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    await session.commit()
    await session.refresh(user)
    
    return user


async def delete_user(
    session: AsyncSession,
    user_id: int
) -> bool:
    user = await find_user_by_id(session=session, user_id=user_id)
    
    if not user:
        return False
    
    await session.delete(user)
    await session.commit()
    
    return True
    
    
async def user_s_posts_by_user_id(
    session: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20
):
    stmt = (
        select(Post)
        .join(User, Post.author_id == User.id)
        .where(User.id == user_id)
        .offset(skip)
        .limit(limit)
        )
    
    result = await session.execute(stmt)
    posts = result.scalars().all()
    
    return posts

# Добавьте в конец crud_user.py

async def authenticate_user(
    session: AsyncSession,
    email: str,
    password: str
) -> Optional[User]:
    """Аутентифицирует пользователя по email и паролю"""
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        return None
    
    if not verify_password(password, user.password):
        return None
    
    return user