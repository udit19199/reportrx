"""Seed script for development — creates tables and a test admin user."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import Base, engine
from src.models import User  # noqa: F401 — ensures tables are registered
from src.auth import hash_password
from src.config import get_settings

settings = get_settings()


def seed():
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    from src.database import SessionLocal

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.id == "admin").first()
        if existing:
            print("Admin user already exists, skipping.")
            return

        user = User(
            id="admin",
            email="admin@admin.com",
            password_hash=hash_password("admin"),
        )
        db.add(user)
        db.commit()
        print("Admin user created (id=admin, password=admin).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
