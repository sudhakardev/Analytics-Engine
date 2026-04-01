"""
Dataset Routes - Upload and list CSV datasets
"""

import os
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pandas as pd

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.ml_models import Dataset
from app.schemas.schemas import DatasetResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a CSV dataset for training."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large.")

    # Save file
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse metadata
    try:
        df = pd.read_csv(file_path)
        row_count, col_count = df.shape
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {str(e)}")

    dataset = Dataset(
        name=file.filename.replace(".csv", ""),
        filename=file.filename,
        file_path=file_path,
        row_count=row_count,
        column_count=col_count,
        owner_id=current_user.id,
    )
    db.add(dataset)
    await db.flush()
    await db.refresh(dataset)

    logger.info(f"Dataset uploaded: {file.filename} by user {current_user.email}")
    return dataset


@router.get("/", response_model=list[DatasetResponse])
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all datasets uploaded by the current user."""
    result = await db.execute(
        select(Dataset).where(Dataset.owner_id == current_user.id).order_by(Dataset.upload_time.desc())
    )
    return result.scalars().all()


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview first 10 rows and column info of a dataset."""
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = pd.read_csv(dataset.file_path)
    return {
        "columns": df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "preview": df.head(10).fillna("").to_dict(orient="records"),
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "missing_values": df.isnull().sum().to_dict(),
    }
