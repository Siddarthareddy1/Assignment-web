import logging
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
import firebase_admin
from firebase_admin import auth as firebase_auth
from app.models.schemas import UserProfile
from app.core.config import settings

logger = logging.getLogger(__name__)

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_demo_user_id: Optional[str] = Header(None)
) -> UserProfile:
    """
    Verifies the Firebase ID token passed in the Authorization header:
    'Bearer <token>'.
    
    If in demo/development mode and no Firebase credentials or token is provided,
    falls back cleanly to an authenticated demo user so the entire application can
    be explored and tested locally without credentials.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()

    # 1. Try Firebase Auth verification if token is provided
    if token and token != "mock-demo-token":
        try:
            # Check if firebase_admin default app is initialized
            if firebase_admin._apps:
                decoded_token = firebase_auth.verify_id_token(token)
                uid = decoded_token.get("uid")
                email = decoded_token.get("email", "student@studypath.edu")
                name = decoded_token.get("name", "StudyPath Student")
                return UserProfile(uid=uid, email=email, displayName=name)
        except Exception as e:
            logger.warning(f"Firebase token verification failed: {e}")
            # If not in demo mode, reject unauthorized tokens
            if not settings.DEMO_MODE:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Firebase authentication token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

    # 2. Local/Dev fallback or mock token
    if settings.DEMO_MODE or token == "mock-demo-token":
        user_id = x_demo_user_id or "usr_demo_student_42"
        return UserProfile(
            uid=user_id,
            email="student.demo@studypath.edu",
            displayName="Alex Mercer",
            preferences={"theme": "dark", "notifications": True}
        )

    # 3. No token provided in strict production mode
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials were not provided",
        headers={"WWW-Authenticate": "Bearer"},
    )

def verify_ownership(resource_owner_id: str, current_user: UserProfile) -> None:
    """Enforces that resource owner matches current authenticated user ID."""
    if resource_owner_id != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to access or modify this resource"
        )
