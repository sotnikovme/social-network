from sqlalchemy import select, or_

from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import UserData, ForUserRead
from app.models import User


async def create_user(
    session: AsyncSession,
    input_user: UserData
) -> User:
    
    db_user = User(
        first_name=input_user.first_name,
        second_name=input_user.second_name,
        email=input_user.email,
        password=input_user.password,
        age=input_user.age,
        gender=input_user.gender
    )
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    
    return db_user

async def find_user(
    session: AsyncSession,
    # name: ForUserRead,
    first_name: str = None, 
    second_name: str = None,
    skip: int = 0,
    limit: int = 20
) -> list[User]:
    
    stmt = select(User).where(
        or_(
            User.first_name.ilike(f"%{first_name}%"),
            User.second_name.ilike(f"%{second_name}%")
        )
    ).offset(skip).limit(limit)
    
    result = await session.execute(stmt)
    users = result.scalars().all()
    
    return users

async def find_user_by_id(
    session: AsyncSession,
    user_id: int,
) -> UserData:
    
    stmt = select(User).where(User.id == user_id)
    
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    return user


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
    