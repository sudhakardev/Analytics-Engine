"""
Pydantic Schemas - Request/Response validation models
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


# ─── Auth ─────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Dataset ──────────────────────────────────────────────────────────────────
class DatasetResponse(BaseModel):
    id: int
    name: str
    filename: str
    row_count: Optional[int]
    column_count: Optional[int]
    target_column: Optional[str]
    upload_time: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Model ────────────────────────────────────────────────────────────────────
class TrainRequest(BaseModel):
    dataset_id: int
    target_column: str
    algorithm: str = "XGBoost"
    test_size: float = 0.2
    n_estimators: int = 100


class ModelResponse(BaseModel):
    id: int
    version: str
    algorithm: str
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    feature_names: Optional[list]
    target_column: Optional[str]
    is_active: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetricsResponse(BaseModel):
    model_id: int
    version: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    feature_names: list
    created_at: datetime
    
    model_config = ConfigDict(protected_namespaces=())


# ─── Prediction ───────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    model_id: int
    input_data: dict
    
    model_config = ConfigDict(protected_namespaces=())


class PredictionResponse(BaseModel):
    id: int
    prediction: str
    confidence: float
    confidence_percent: float
    decision_suggestion: str
    decision_action: str
    input_data: dict
    timestamp: datetime
    reasoning_trace: list = []

    model_config = ConfigDict(from_attributes=True)
