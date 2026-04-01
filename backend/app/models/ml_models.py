"""
SQLAlchemy ORM Models - Dataset, MLModel, Prediction
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    target_column = Column(String(255), nullable=True)
    upload_time = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    owner = relationship("User", back_populates="datasets")
    models = relationship("MLModel", back_populates="dataset")


class MLModel(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), nullable=False, default="v1")
    algorithm = Column(String(100), nullable=False, default="RandomForest")
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    feature_names = Column(JSON, nullable=True)
    target_column = Column(String(255), nullable=True)
    model_path = Column(String(512), nullable=True)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = archived
    created_at = Column(DateTime, default=datetime.utcnow)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)

    dataset = relationship("Dataset", back_populates="models")
    predictions = relationship("Prediction", back_populates="model")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    input_data = Column(JSON, nullable=False)
    prediction = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    decision_suggestion = Column(Text, nullable=True)
    decision_action = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=True)

    user = relationship("User", back_populates="predictions")
    model = relationship("MLModel", back_populates="predictions")
