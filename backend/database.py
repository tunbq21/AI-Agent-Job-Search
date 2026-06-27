import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# We will use SQLite by default to make local execution easy without Docker.
# To use PostgreSQL, set DATABASE_URL in your environment or .env file.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./jobsearch.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})
else:
    engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
