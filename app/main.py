from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.models import Base
from app.database import engine, get_session
from app.routers import users, posts


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
app.include_router(posts.router)

@app.get("/")
async def serve_frontend():
    return FileResponse("social_network_frontend/index.html")

# Страница пользователей
@app.get("/users")
async def serve_users_page():
    return FileResponse("social_network_frontend/users.html")

# Страница постов
@app.get("/posts")
async def serve_posts_page():
    return FileResponse("social_network_frontend/posts.html")

# Документация API
@app.get("/api-docs")
async def serve_api_docs():
    return FileResponse("social_network_frontend/api.html")

# API endpoint для проверки статуса
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API работает"}

# Если нужно обслуживать другие файлы фронтенда
@app.get("/{filename}")
async def serve_frontend_file(filename: str):
    try:
        return FileResponse(f"social_network_frontend/{filename}")
    except:
        return {"error": "File not found"} 