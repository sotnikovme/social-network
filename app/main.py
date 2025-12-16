from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models import Base
from app.database import engine, get_session
from app.routers import users


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    
    yield
    
    await engine.dispose()
    
    
app = FastAPI(
    title="Social Network API",
    description="API для социальной сети",
    version="1.0.0",
    lifespan=lifespan 
)

app.include_router(users.router)

@app.get("/")
async def main():
    return {"message": "Social Network API is running"}    