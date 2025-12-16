from enum import Enum
from builtins import Exception
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class DigitPasswordError(Exception):
    def __str__(self, *args) -> str:
        return 'Пароль должен содержать хотя бы одну цифру'

class AlphaPasswordError(Exception):
    def __str__(self) -> str:
        return 'Пароль должен содержать хотя бы одну букву'
    
class InvalideEmailError(Exception):
    def __str__(self) -> str:
        return 'Некорректный email'
    
class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    

class ForUserRead(BaseModel):
    first_name: str = Field(max_length=100, description = "Имя")
    second_name: str = Field(max_length=100, description = "Фамилия")
    
class ReadUserParams(ForUserRead):
    email: str = Field(max_length=30, description = "Email")
    age: int = Field(gt=0, lt=151, description="Возраст") 
    gender: Gender

class UserData(ReadUserParams):
    # first_name: str = Field(max_length=100, description = "Имя")
    # second_name: str = Field(max_length=100, description = "Фамилия")
    # email: str = Field(max_length=30, description = "Email")
    password: str  = Field(max_length=30, min_length=8, description = "Пароль")
    # age: int = Field(max_digits=150, description="Возраст")
    # gender: Gender
    
    @field_validator("password")
    @classmethod
    def password_validator(cls, value):
        
        if not any(char.isdigit() for char in value):
            raise DigitPasswordError()
        
        if not any(char.isalpha() for char in value):
            raise AlphaPasswordError()
        
        return value
    
    # @field_validator("email")
    # @classmethod
    # def email_validator(cls, value: str) -> str:
    #     # if  len(1 for char in value if (char == "@" or char == ".")) != 2:
    #     if  value.count('@') != 1 or '.' not in value.split('@')[1]:
    #         raise InvalideEmailError()

class UpdateUserName(BaseModel):
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    
class UpdateUserEmail(BaseModel):
    email: Optional[EmailStr] = None
    
class UpdateUserAge(BaseModel):
    age: Optional[int] = None
    
class UpdateUser(BaseModel):
    first_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None