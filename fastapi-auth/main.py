from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

import os
import traceback
from datetime import datetime

from posts import router as posts_router
from comments import router as comments_router
from auth import router as auth_router
from oauth import router as oauth_router
from database import engine, Base

import models


# Load variables from .env
load_dotenv()


# Create FastAPI application
app = FastAPI(
    title="LinkedIn Clone API",
    version="1.0.0",
)


# Session middleware used by OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv(
        "SESSION_SECRET_KEY",
        "temporary-session-secret-key",
    ),
    same_site="lax",
    https_only=False,
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://project-linkedin-git-main-taha-sajid-228s-projects.vercel.app",
        "https://project-linkedin-three.vercel.app",
    ],
    # Allows other Vercel preview deployment URLs
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Register routers
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(posts_router)
app.include_router(comments_router)


# Basic health-check route
@app.get("/")
def root():
    return {
        "message": "LinkedIn backend is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = (
        f"\n--- Exception at {datetime.now()} ---\n"
        + "".join(
            traceback.format_exception(
                type(exc),
                exc,
                exc.__traceback__,
            )
        )
    )

    with open("error.log", "a", encoding="utf-8") as file:
        file.write(err_msg)

    print(err_msg)

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error": str(exc),
        },
    )


def main():
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )


if __name__ == "__main__":
    main()