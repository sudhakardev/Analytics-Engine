import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.ml_models import Dataset, MLModel, Prediction
from app.core.security import hash_password
from sqlalchemy import select

async def seed_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "demo@fde.ai"))
        existing = result.scalar_one_or_none()
        
        if not existing:
            demo_user = User(
                email="demo@fde.ai",
                hashed_password=hash_password("demo1234"),
                full_name="Demo User"
            )
            db.add(demo_user)
            await db.commit()
            print("✅ Demo user created!")
        else:
            print("✅ Demo user already exists!")
            # Reset password just in case
            existing.hashed_password = hash_password("demo1234")
            await db.commit()
            
if __name__ == "__main__":
    asyncio.run(seed_db())
