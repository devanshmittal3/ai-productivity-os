from pydantic import BaseModel, EmailStr, Field


class UserSettingsSchema(BaseModel):
    theme: str = Field(default="dark", pattern="^(light|dark)$")
    workHoursStart: str = Field(default="09:00", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    workHoursEnd: str = Field(default="17:00", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    focusSessionDuration: int = Field(default=25, ge=5, le=120)
    burnoutThresholdHours: int = Field(default=50, ge=10, le=100)

class UserRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)
    role: str = Field(default="professional", pattern="^(student|freelancer|developer|manager|professional)$")

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str

class UserDetailSchema(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    settings: UserSettingsSchema
