from fastapi import FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from database import get_db, engine, Base
import models

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

#@app.get("/test-db")
#def test_db(db: Session = Depends(get_db)):
 #   result = db.execute(text("SELECT NOW()"))
  #  return {"database_time": str(result.fetchone()[0])}

app.include_router(auth_router)