from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload 
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import PostData, PostUpdate
from app.models import Post, User
import app.crud.crud_user as crud_user


async def get_posts(
    session: AsyncSession,
    skip: int = 0,
    limit: int = 10,
    ) -> list[Post]:
    stmt = select(Post).options(selectinload(Post.author)).offset(skip).limit(limit).order_by(Post.created_at.desc())
    
    result = await session.execute(stmt)
    posts = result.scalars().all()
    return posts


async def get_posts_by_id(
    session: AsyncSession,
    post_id: str
    ) -> Post | None:
    stmt = select(Post).where(Post.id == post_id)
        
    result = await session.execute(stmt)
    posts = result.scalar_one_or_none()
    return posts


async def get_posts_by_title(
    session: AsyncSession,
    post_title: str
    ):
    stmt = select(Post).where(Post.title.ilike(f"%{post_title}%"))
        
    result = await session.execute(stmt)
    posts = result.scalar_one_or_none()
    return posts


async def create_post(
    session: AsyncSession,
    post_data: PostData
) -> PostData:
    
    check_user = await crud_user.check_user_by_id(session=session, user_id=post_data.author_id)
    if check_user:
        db_post = Post(
            author_id = post_data.author_id,
            title = post_data.title,
            body = post_data.body,
        )
        session.add(db_post)
        await session.commit()
        await session.refresh(db_post)      
        
        return db_post
    else:
        return None


async def update_post(
    session: AsyncSession,
    post_id: int,
    update_data: dict,
):
    try:
        post = await get_posts_by_id(session=session, post_id=post_id)
        if post:
            for feild, value in update_data.items():
                if hasattr(post, feild): 
                    setattr(post, feild, value)
            
            await session.commit()
            await session.refresh(post)
            
            return post
        else:
            return None

    except Exception as e:
        return None


# async def get_post_by_user(
#     session: AsyncSession,
#     first_name: str,
#     second_name: str,
#     skip: int = 0,
#     limit: int = 10,
# ):
    
#     stmt = (
#         select(Post, User.first_name, User. second_name)
#         .join(User, Post.author_id == User.id)
#         .where(
#             and_(
#                 User.first_name = 
#             )
#         )
#     )