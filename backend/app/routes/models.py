"""
Model Training & Metrics Routes
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.ml_models import Dataset, MLModel
from app.schemas.schemas import TrainRequest, ModelResponse, MetricsResponse
from ml.train import MLTrainer

logger = logging.getLogger(__name__)
router = APIRouter()

# Track training jobs
training_jobs: dict = {}


@router.post("/train", response_model=ModelResponse)
async def train_model(
    request: TrainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Train a new ML model on a dataset."""
    # Fetch dataset
    result = await db.execute(select(Dataset).where(Dataset.id == request.dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    # Deactivate previous active models
    prev = await db.execute(select(MLModel).where(MLModel.is_active == 1))
    for m in prev.scalars().all():
        m.is_active = 0

    # Count versions
    versions_result = await db.execute(select(MLModel))
    version_num = len(versions_result.scalars().all()) + 1

    # Run training (synchronous since it's CPU-bound; use Celery for async in production)
    try:
        trainer = MLTrainer(algorithm=request.algorithm, n_estimators=request.n_estimators)
        metrics = trainer.train(
            file_path=dataset.file_path,
            target_col=request.target_column,
            test_size=request.test_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Training failed")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

    # Update dataset target column  
    dataset.target_column = request.target_column

    ml_model = MLModel(
        version=f"v{version_num}",
        algorithm=request.algorithm,
        accuracy=metrics["accuracy"],
        precision=metrics["precision"],
        recall=metrics["recall"],
        f1_score=metrics["f1_score"],
        feature_names=metrics["feature_names"],
        target_column=request.target_column,
        model_path=metrics["model_path"],
        is_active=1,
        dataset_id=dataset.id,
    )
    db.add(ml_model)
    await db.flush()
    await db.refresh(ml_model)

    logger.info(f"Model {ml_model.version} trained by {current_user.email}")
    return ml_model


@router.get("/", response_model=list[ModelResponse])
async def list_models(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all trained models."""
    result = await db.execute(select(MLModel).order_by(MLModel.created_at.desc()))
    return result.scalars().all()


@router.get("/active", response_model=ModelResponse)
async def get_active_model(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get the currently active ML model."""
    result = await db.execute(select(MLModel).where(MLModel.is_active == 1))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="No active model found. Train a model first.")
    return model


@router.get("/{model_id}/metrics", response_model=MetricsResponse)
async def get_metrics(
    model_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get performance metrics for a specific model."""
    result = await db.execute(select(MLModel).where(MLModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found.")

    return MetricsResponse(
        model_id=model.id,
        version=model.version,
        algorithm=model.algorithm,
        accuracy=model.accuracy or 0,
        precision=model.precision or 0,
        recall=model.recall or 0,
        f1_score=model.f1_score or 0,
        feature_names=model.feature_names or [],
        created_at=model.created_at,
    )
