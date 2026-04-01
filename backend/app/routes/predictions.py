"""
Prediction Routes - Real-time ML predictions with decision suggestions
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.ml_models import MLModel, Prediction
from app.schemas.schemas import PredictRequest, PredictionResponse
from ml.predict import MLPredictor

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    request: PredictRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run real-time prediction using the active ML model."""
    result = await db.execute(select(MLModel).where(MLModel.id == request.model_id))
    model_record = result.scalar_one_or_none()
    if not model_record:
        raise HTTPException(status_code=404, detail="Model not found.")
    if not model_record.model_path:
        raise HTTPException(status_code=422, detail="Model file path not set.")

    try:
        predictor = MLPredictor(model_record.model_path)
        result_data = predictor.predict(request.input_data)
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    # Store prediction in DB
    prediction = Prediction(
        input_data=request.input_data,
        prediction=result_data["prediction"],
        confidence=result_data["confidence"],
        decision_suggestion=result_data["decision_suggestion"],
        decision_action=result_data["decision_action"],
        user_id=current_user.id,
        model_id=request.model_id,
    )
    db.add(prediction)
    await db.flush()
    await db.refresh(prediction)

    return PredictionResponse(
        id=prediction.id,
        prediction=prediction.prediction,
        confidence=prediction.confidence,
        confidence_percent=result_data["confidence_percent"],
        decision_suggestion=prediction.decision_suggestion,
        decision_action=prediction.decision_action,
        input_data=prediction.input_data,
        timestamp=prediction.timestamp,
        reasoning_trace=result_data.get("reasoning_trace", []),
    )


@router.get("/history", response_model=list[PredictionResponse])
async def prediction_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent prediction history for the current user."""
    result = await db.execute(
        select(Prediction)
        .where(Prediction.user_id == current_user.id)
        .order_by(Prediction.timestamp.desc())
        .limit(limit)
    )
    preds = result.scalars().all()
    return [
        PredictionResponse(
            id=p.id,
            prediction=p.prediction,
            confidence=p.confidence,
            confidence_percent=round(p.confidence * 100, 2),
            decision_suggestion=p.decision_suggestion or "",
            decision_action=p.decision_action or "",
            input_data=p.input_data,
            timestamp=p.timestamp,
        )
        for p in preds
    ]


@router.get("/analytics")
async def analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate analytics: prediction distribution, confidence stats."""
    result = await db.execute(
        select(Prediction).where(Prediction.user_id == current_user.id)
    )
    preds = result.scalars().all()
    if not preds:
        return {"total": 0, "distribution": {}, "avg_confidence": 0, "actions": {}}

    distribution: dict = {}
    actions: dict = {}
    confidences = []

    for p in preds:
        distribution[p.prediction] = distribution.get(p.prediction, 0) + 1
        actions[p.decision_action] = actions.get(p.decision_action, 0) + 1
        confidences.append(p.confidence)

    return {
        "total": len(preds),
        "distribution": distribution,
        "avg_confidence": round(sum(confidences) / len(confidences) * 100, 2),
        "min_confidence": round(min(confidences) * 100, 2),
        "max_confidence": round(max(confidences) * 100, 2),
        "actions": actions,
        "recent_predictions": [
            {
                "prediction": p.prediction,
                "confidence": round(p.confidence * 100, 2),
                "action": p.decision_action,
                "timestamp": p.timestamp.isoformat(),
            }
            for p in preds[:20]
        ],
    }
