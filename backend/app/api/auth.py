from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any, Dict

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.auth import UserRegisterSchema, UserLoginSchema, TokenSchema, UserDetailSchema
from app.api.deps import get_user_repository, get_current_user, UserRepositoryInterface

router = APIRouter()

@router.post("/register", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserRegisterSchema,
    user_repo: UserRepositoryInterface = Depends(get_user_repository)
) -> Any:
    # Check if user email already exists
    existing = await user_repo.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
        
    hashed_password = get_password_hash(user_in.password)
    user_dict = {
        "email": user_in.email,
        "passwordHash": hashed_password,
        "name": user_in.name,
        "role": user_in.role,
        "settings": {
            "theme": "dark",
            "workHoursStart": "09:00",
            "workHoursEnd": "17:00",
            "focusSessionDuration": 25,
            "burnoutThresholdHours": 50
        }
    }
    created_user = await user_repo.create(user_dict)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=created_user["id"], expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": created_user["id"]
    }

@router.post("/login", response_model=TokenSchema)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepositoryInterface = Depends(get_user_repository)
) -> Any:
    """OAuth2 password login flow returning a JWT."""
    user = await user_repo.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user["id"], expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"]
    }

from app.models.auth import UserSettingsSchema

@router.get("/me", response_model=UserDetailSchema)
async def read_user_me(
    current_user: Dict = Depends(get_current_user)
) -> Any:
    return current_user

@router.put("/me/settings", response_model=UserDetailSchema)
async def update_user_settings(
    settings_in: UserSettingsSchema,
    current_user: Dict = Depends(get_current_user),
    user_repo: UserRepositoryInterface = Depends(get_user_repository)
) -> Any:
    # Merge new settings with existing fields
    updated_user = await user_repo.update(
        current_user["id"],
        {"settings": settings_in.model_dump()}
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return updated_user
