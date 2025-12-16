from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DB_URL_ASYNC = "postgresql+asyncpg://user:example@localhost:5432/social_network"

engine = create_async_engine(
    url = DB_URL_ASYNC,
    echo = True,
    future=True
)

async_session = async_sessionmaker(
    bind = engine,
    class_ = AsyncSession,
    expire_on_commit = False,
    autocommit = False
)

async def get_session():
    async with async_session() as session:
        yield session