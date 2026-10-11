import pytest
from fastapi import HTTPException
from app.core.security import verify_ownership
from app.models.schemas import UserProfile
from app.api.endpoints.documents import ALLOWED_EXTENSIONS

def test_file_type_validation_allowed_extensions():
    assert "pdf" in ALLOWED_EXTENSIONS
    assert "docx" in ALLOWED_EXTENSIONS
    assert "pptx" in ALLOWED_EXTENSIONS
    assert "txt" in ALLOWED_EXTENSIONS
    assert "png" in ALLOWED_EXTENSIONS
    assert "jpg" in ALLOWED_EXTENSIONS
    assert "doc" in ALLOWED_EXTENSIONS
    assert "exe" not in ALLOWED_EXTENSIONS
    assert "sh" not in ALLOWED_EXTENSIONS

def test_user_ownership_enforcement_success():
    user = UserProfile(uid="usr_alice_123", email="alice@test.edu")
    # Same owner should pass without error
    verify_ownership("usr_alice_123", user)

def test_user_ownership_enforcement_forbidden():
    user = UserProfile(uid="usr_alice_123", email="alice@test.edu")
    # Different owner must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        verify_ownership("usr_bob_999", user)
    assert exc_info.value.status_code == 403
    assert "Access forbidden" in exc_info.value.detail
