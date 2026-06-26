from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import traceback
from datetime import datetime

from auth import router as auth_router
from oauth import router as oauth_router
from database import engine, Base
import models

load_dotenv()

app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", "temporary-session-secret-key"),
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    err_msg = (
        f"\n--- Exception at {datetime.now()} ---\n"
        + "".join(traceback.format_exception(None, exc, exc.__traceback__))
    )

    with open("error.log", "a", encoding="utf-8") as f:
        f.write(err_msg)

    print(err_msg)

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )


app.include_router(auth_router)
app.include_router(oauth_router)


def main():
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "localhost"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("RELOAD", "true").lower() == "true",
    )


if __name__ == "__main__":
    main()