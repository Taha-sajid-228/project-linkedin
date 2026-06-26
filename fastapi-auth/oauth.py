from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from dotenv import load_dotenv
from urllib.parse import quote
import os

from database import get_db
from models import User
from auth import create_access_token

load_dotenv()

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

oauth = OAuth()

oauth.register(
    name="github",
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    access_token_url="https://github.com/login/oauth/access_token",
    authorize_url="https://github.com/login/oauth/authorize",
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "user:email"},
)

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def redirect_with_error(path: str, message: str):
    return RedirectResponse(f"{FRONTEND_URL}{path}?error={quote(message)}")


def check_oauth_configured(provider: str):
    if provider == "google":
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if (
            not client_id
            or not client_secret
            or "your_google" in client_id
            or "your_google" in client_secret
        ):
            raise HTTPException(
                status_code=400,
                detail="Google OAuth is not configured correctly."
            )

    if provider == "github":
        client_id = os.getenv("GITHUB_CLIENT_ID")
        client_secret = os.getenv("GITHUB_CLIENT_SECRET")

        if (
            not client_id
            or not client_secret
            or "your_github" in client_id
            or "your_github" in client_secret
        ):
            raise HTTPException(
                status_code=400,
                detail="GitHub OAuth is not configured correctly."
            )


def save_pending_user_to_session(
    request: Request,
    email: str,
    provider: str,
    provider_id: str,
    profile_picture: str | None,
    suggested_name: str | None = None
):
    request.session["pending_oauth_user"] = {
        "email": email,
        "provider": provider,
        "provider_id": provider_id,
        "profile_picture": profile_picture,
        "suggested_name": suggested_name,
    }


@router.get("/auth/github/register")
async def github_register(request: Request):
    check_oauth_configured("github")
    request.session.clear()
    request.session["oauth_flow"] = "register"

    redirect_uri = str(request.url_for("github_callback"))
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/auth/github/login")
async def github_login(request: Request):
    check_oauth_configured("github")
    request.session.clear()
    request.session["oauth_flow"] = "login"

    redirect_uri = str(request.url_for("github_callback"))
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/auth/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.github.authorize_access_token(request)

    user_response = await oauth.github.get("user", token=token)
    github_user = user_response.json()

    email_response = await oauth.github.get("user/emails", token=token)
    emails = email_response.json()

    email = None

    if isinstance(emails, list):
        for item in emails:
            if item.get("primary") and item.get("verified"):
                email = item.get("email")
                break

        if not email:
            for item in emails:
                if item.get("verified"):
                    email = item.get("email")
                    break

    if not email:
        email = github_user.get("email")

    if not email:
        return redirect_with_error("/register", "GitHub email not found.")

    flow = request.session.get("oauth_flow")

    provider_id = str(github_user.get("id"))
    profile_picture = github_user.get("avatar_url")
    suggested_name = github_user.get("name") or github_user.get("login")

    user = db.query(User).filter(User.email == email).first()

    if flow == "login":
        if not user:
            return redirect_with_error("/login", "Please register first.")

        access_token = create_access_token(
            data={
                "sub": user.email,
                "id": user.id,
                "role": user.role,
            }
        )

        return RedirectResponse(
            f"{FRONTEND_URL}/oauth-success?token={access_token}&role={user.role}"
        )

    if flow == "register":
        if user:
            return redirect_with_error("/register", "Email already exists. Please login.")

        save_pending_user_to_session(
            request=request,
            email=email,
            provider="github",
            provider_id=provider_id,
            profile_picture=profile_picture,
            suggested_name=suggested_name,
        )

        return RedirectResponse(f"{FRONTEND_URL}/signup-setup")

    return redirect_with_error("/login", "Invalid OAuth flow.")


@router.get("/auth/google/register")
async def google_register(request: Request):
    check_oauth_configured("google")
    request.session.clear()
    request.session["oauth_flow"] = "register"

    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/login")
async def google_login(request: Request):
    check_oauth_configured("google")
    request.session.clear()
    request.session["oauth_flow"] = "login"

    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    google_user = token.get("userinfo")

    if not google_user:
        return redirect_with_error("/register", "Google user info not found.")

    email = google_user.get("email")
    provider_id = google_user.get("sub")
    profile_picture = google_user.get("picture")
    suggested_name = google_user.get("name")

    if not email:
        return redirect_with_error("/register", "Google email not found.")

    flow = request.session.get("oauth_flow")

    user = db.query(User).filter(User.email == email).first()

    if flow == "login":
        if not user:
            return redirect_with_error("/login", "Please register first.")

        access_token = create_access_token(
            data={
                "sub": user.email,
                "id": user.id,
                "role": user.role,
            }
        )

        return RedirectResponse(
            f"{FRONTEND_URL}/oauth-success?token={access_token}&role={user.role}"
        )

    if flow == "register":
        if user:
            return redirect_with_error("/register", "Email already exists. Please login.")

        save_pending_user_to_session(
            request=request,
            email=email,
            provider="google",
            provider_id=provider_id,
            profile_picture=profile_picture,
            suggested_name=suggested_name,
        )

        return RedirectResponse(f"{FRONTEND_URL}/signup-setup")

    return redirect_with_error("/login", "Invalid OAuth flow.")


@router.get("/auth/pending-oauth-user")
def get_pending_oauth_user(request: Request):
    pending_user = request.session.get("pending_oauth_user")

    if not pending_user:
        raise HTTPException(status_code=400, detail="No OAuth registration found.")

    return {
        "email": pending_user.get("email"),
        "suggested_name": pending_user.get("suggested_name"),
        "provider": pending_user.get("provider"),
        "profile_picture": pending_user.get("profile_picture"),
    }


@router.post("/auth/oauth-complete-registration")
def oauth_complete_registration(
    request: Request,
    name: str = Form(...),
    username: str = Form(...),
    db: Session = Depends(get_db)
):
    pending_user = request.session.get("pending_oauth_user")

    if not pending_user:
        raise HTTPException(status_code=400, detail="No OAuth registration found.")

    name_stripped = name.strip()
    username_stripped = username.strip()

    if len(name_stripped) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters long.")

    if len(username_stripped) < 6:
        raise HTTPException(status_code=400, detail="Username must be at least 6 characters long.")

    existing_username = db.query(User).filter(User.username == username_stripped).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    existing_email = db.query(User).filter(User.email == pending_user["email"]).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists.")

    new_user = User(
        name=name_stripped,
        username=username_stripped,
        email=pending_user["email"],
        password=None,
        role="user",
        is_verified=True,
        otp_code=None,
        otp_expires_at=None,
        provider=pending_user["provider"],
        provider_id=pending_user["provider_id"],
        profile_picture=pending_user["profile_picture"],
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    request.session.pop("pending_oauth_user", None)
    request.session.pop("oauth_flow", None)

    access_token = create_access_token(
        data={
            "sub": new_user.email,
            "id": new_user.id,
            "role": new_user.role,
        }
    )

    return {
        "message": "OAuth registration completed.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "is_verified": new_user.is_verified,
            "provider": new_user.provider,
            "profile_picture": new_user.profile_picture,
        }
    }