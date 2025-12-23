from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import DateTime, ForeignKey, String, Integer, Text
from sqlalchemy.sql import func

from datetime import datetime, date

from app.secur import verify_password, get_password_hash
from app.schemas import Gender

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    
    id : Mapped[int] = mapped_column("id", Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    second_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    age:  Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[Gender] = mapped_column(String, nullable=False)
    posts: Mapped[list["Post"]] = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    
    def verify_password(self, password: str) -> bool:
        """Проверяет пароль"""
        return verify_password(password, self.password)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    @property
    def password_hash(self):
        return self.password
    
    @password_hash.setter
    def password_hash(self, value: str):
        """Автоматически хэширует пароль при установке"""
        self.password = get_password_hash(value)
        
    
class Post(Base):
    __tablename__ = "posts"
    
    id : Mapped[int] = mapped_column("id", Integer, primary_key=True)
    
    
    author_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    body: Mapped[str] = mapped_column(Text)
    # owner: Mapped[str] = mapped_column(String, nullable=False)
    likes:  Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    author: Mapped["User"] = relationship(
        "User", 
        back_populates="posts"
    )